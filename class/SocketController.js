var io = require('socket.io');
var path = require('path');
var Logger = require('./Logger.js');
var Send = require('./Send.js');


function SocketController(httpServerListener, configObj) {
    this.httpServerListener = httpServerListener;
    this.config = configObj.getConfig();
    this.buffer = configObj.getBuffer();
    this.ripleyVersion = configObj.getRipleyVersion();
    this.configObj = configObj;
    this.ioManagerInstance;
    
    this.logger = new Logger(configObj);
    
    this.startSocketManager.call(this, '');
    this.configureSocketManager.call(this, '');
    this.setupEvents.call(this, '');
    
    //TODO loeschen nach debug
    this.cnt=0;
};


SocketController.prototype.startSocketManager = function() {
    this.ioManagerInstance = io.listen(this.httpServerListener); 
}

SocketController.prototype.configureSocketManager = function() {
    //~ this.ioManagerInstance.set('log level', 5);
    this.ioManagerInstance.set('log level', 0);

    this.ioManagerInstance.set('transports', [
                                  'websocket', 
                                // 'flashsocket',  // had problems with flash policy file
                                // see http://joshuakehn.com/blog/view/2/WebSocket-Tutorial-with-Node-js 
                                // for details
                                'htmlfile',
                                'xhr-polling',
                                'jsonp-polling'
                              ]);
    // this.ioManagerInstance.enable('browser client minification');  //consumes too much extra time
    this.ioManagerInstance.enable('browser client etag'); 
    this.ioManagerInstance.enable('browser client gzip');
}


SocketController.prototype.setupEvents = function() {
    var that = this;
    
    this.ioManagerInstance.sockets.on('connection', function (socket) {
        
        socket.on('eventGetRipleyConfig', function () {
            var configArray;
            
            that.logger.log("Event \"eventGetRipleyConfig\" received. Sending ripley config.", 4);
            configArray = that.config.getConfigArray();
            socket.emit('eventAnswerRipleyConfig',  JSON.stringify(configArray));
        });

        socket.on('eventGetBufferContent', function () {
            that.logger.log("Event \"eventGetBufferContent\" received. Sending buffer content.", 4);
            that.emitAnswerBufferContent();
        });
        
        socket.on('eventGetOverviewData', function() {
            var overviewDataArray;
            
            that.logger.log("Event \"eventGetOverviewData\" received. Sending data.", 4);
            overviewDataArray = that.config.getOverviewDataArray();
            socket.emit('eventAnswerOverviewData',  JSON.stringify(overviewDataArray));
        });
        
        
        socket.on('eventTriggerSendForAction', function (sendAction) {
            that.logger.log("Event \"eventTriggerSendForAction\" received. Trying to trigger " + sendAction, 4);

            that.logger.log("", 2);
            that.logger.log("----- Received manual trigger for \"" + sendAction + "\" -----", 1);
            
            if ( that.configObj.ripleyIsConnectedToPcs() ) {
                var sender = new Send( sendAction, that.configObj);
                sender.sendTelegram();            
            } 
            else {
                that.logger.log("Ripley is not connected to the PCS. Doing nothing.", 2);            
            }
        });


        socket.on('eventGetGeneralRipleyData', function () {            
            that.logger.log("Event \"eventGetGeneralRipleyData\" received. Sending static ripley GUI data.", 4);

            var description = that.config.getConfig().description || 'Untitled Configuration',
                configFilePath = that.configObj.getConfigFilePath(),
                configFileName = path.basename( configFilePath );
            
            var generalRipleyData = { version: that.ripleyVersion,
                                      description : description,
                                      configFilePath : configFilePath,
                                      configFileName : configFileName };
                                      
            socket.emit('eventAnswerGeneralRipleyData',  JSON.stringify(generalRipleyData));
        });
        
        socket.on('eventGetPcsConnectionStatus', function () {
            that.logger.log("Event \"eventGetPcsConnectionStatus\" received. Sending current PCS connection status.", 4);
            that.emitPcsConnectionStatus();
        });
    });
}

SocketController.prototype.emitAnswerBufferContent = function() {
    this.ioManagerInstance.sockets.emit('eventAnswerBufferContent',  
                                         JSON.stringify( this.getBufferHeadingsAndContent() ));
}

//TODO IE empfaengt nur 1/3 der daten, zu schnell?
SocketController.prototype.emitLogEntry = function(singleLogLine) {
    this.ioManagerInstance.sockets.emit('eventLogEntry', singleLogLine );
    //~ this.cnt++;
}

SocketController.prototype.emitPcsConnectionStatus = function() {
    var status = this.configObj.getPcsToRipleyConnectionStatus();
    
    this.ioManagerInstance.sockets.emit('eventPcsConnectionStatus', status );
}

SocketController.prototype.getBufferHeadingsAndContent = function() {
    var bufferHeadingsAndContent = {};

    this.buffer.fillAllBufferVariableNames();
    
    bufferHeadingsAndContent['headings'] = this.buffer.getAllBufferVariableNames();
    bufferHeadingsAndContent['content'] = this.buffer.getContentArray();

    return bufferHeadingsAndContent;
}

// node.js module export
module.exports = SocketController;
