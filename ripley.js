var net = require('net');   // requires min. node 5.9
var io = require('socket.io');
var DateFormat = require('date.js').DateFormat;

var Telegram = require('./class/Telegram.js');
var Session = require('./class/Session.js');
var Receive = require('./class/Receive.js');
var Config = require('./class/Config.js');
var Send = require('./class/Send.js');
var SyntaxCheck = require('./class/SyntaxCheck.js');
var Buffer = require('./class/Buffer.js');
var GlobalConfigObj = require('./class/GlobalConfigObj.js');
var CommandLineArguments = require('./class/CommandLineArguments.js');
var HttpServer = require('./class/HttpServer.js');
var SocketController = require('./class/SocketController.js');
var Logger = require('./class/Logger.js');
require('./class/Global.js');
require('./class/String.js');


// constructor
function Ripley(){
    this.configObj = this.getGlobalConfigObject();
    this.logger = new Logger(this.configObj);
    this.configStructure;
}

Ripley.prototype.getGlobalConfigObject = function(){
    var globalConfigObject = new GlobalConfigObj();
    return globalConfigObject.getObject();
}

Ripley.prototype.doCheckCommandLineArguments = function(){
    var commandLineArguments = new CommandLineArguments(this.configObj);
    commandLineArguments.check();
}

Ripley.prototype.doSyntaxCheck = function(){
    var syntaxCheck = new SyntaxCheck(this.configObj);
}

Ripley.prototype.fillConfigObjectWithGlobalObjects = function(){
    var config = new Config();
    this.configObj.addConfig(config);
    
    // also fill our object var
    this.configStructure = config.getConfig();
    
    var sessionStore = new Session(this.configObj);
    this.configObj.addSessionStore(sessionStore);
    
    var buffer = new Buffer(this.configObj);
    this.configObj.addBuffer(buffer);
    
    // add config filename for displaying in GUI
    var configFilePath = config.getConfigPath();
    this.configObj.addConfigFilePath(configFilePath);
}

Ripley.prototype.startHttpServer = function(){
    // init web parts
    var httpServer = new HttpServer(this.configObj);
    var httpServerListener = httpServer.startServer();

    var socketController = new SocketController(httpServerListener, this.configObj);
    // add me as well to config object
    this.configObj.addSocketController(socketController);
}

Ripley.prototype.startEmulator = function(){
    var that = this,
        connectionType = this.configStructure.connectionType;

    this.logger.log('Configured connection type is "' + connectionType + '"');

    // client mode, ripley is connecting to remote host
    if ( connectionType === "active" ) {
        this.startEmulatorWithActiveConnection();
    }

    // server mode, ripley is waiting for incoming connections
    else if ( connectionType === "passive" ) {
        this.startEmulatorWithPassiveConnection();
    }
}

Ripley.prototype.startEmulatorWithActiveConnection = function(){
    var that = this,
        destinationHost = this.configStructure.destinationHost,
        port = this.configStructure.port;
    
    this.logger.log("Trying to connect to " + destinationHost + ":" + port);
    var c = net.connect(port, destinationHost, function() { //'connect' listener
        that.logger.log('Connected');
        that.configObj.addConnectionHandle(c);
        
        var send = new Send('', that.configObj);
        send.initateTelegramSendout();
    })
    c.on('data', function(data) {
        var rcv = new Receive(data, that.configObj);
        rcv.processReceivedData();
    });
}

Ripley.prototype.startEmulatorWithPassiveConnection = function(){
    var that = this;

    var server = net.createServer(function(c) { //'connection' listener
        that.configObj.addConnectionHandle(c);
        that.doPcsConnectionStatusChangeActions("connected");

        that.logger.log('Incoming connection from host ' + c.remoteAddress);

        var send = new Send('', that.configObj);
        send.initateTelegramSendout();

        c.on('data', function(data) {
            var rcv = new Receive(data, that.configObj);
            rcv.processReceivedData();
        });

        // update ripley <> PCS connection status on disconnect
        c.on('end', function () {
            that.doPcsConnectionStatusChangeActions("notconnected");
            that.logger.log('Received disconnect from PCS.');
            send.resetEventRepeatCycles();            
        });

    });
    // bind server
    server.listen(this.configStructure.port, function() {
        that.logger.log("Start listening on port " + that.configStructure.port);
    });
    
}

Ripley.prototype.doPcsConnectionStatusChangeActions = function(connectionStatus){
        this.configObj.setPcsToRipleyConnectionStatus(connectionStatus);
        this.sendPcsConnectionStatusChangeToGui();
}

Ripley.prototype.sendPcsConnectionStatusChangeToGui = function(){
    var socketController = this.configObj.getSocketController();
    
    if ( socketController) {
        socketController.emitPcsConnectionStatus();
    }
}



var ripley = new Ripley();
ripley.doCheckCommandLineArguments();
ripley.fillConfigObjectWithGlobalObjects();
ripley.doSyntaxCheck();
ripley.startHttpServer();
ripley.startEmulator();

