var http = require('http');
var fs = require('fs');
var path = require('path');
var os = require('os');
var Logger = require('./Logger.js');


function HttpServer(configObj) {
    this.configObj = configObj;
    this.config = configObj.getConfig().getConfig();
    
    this.port = this.getHttpPort();
    this.webDirectory = this.getWebDirectory();    

    this.logger = new Logger(this.configObj);
};


HttpServer.prototype.getHttpPort = function() {
    if ( this.config.httpPort ) {
        return this.config.httpPort;
    }
    return this.configObj.getDefaultHttpPort();
}

HttpServer.prototype.startServer = function() {
    var that = this;
    
    var httpServer = http.createServer(function (request, response) {
        var filePath = that.getFilePath(request);
     
        that.logger.log('URL ' + request.url + ' requested. Try serving file ' + filePath, 4);
         
        path.exists(filePath, function(exists) {
         
            if (exists) {
                fs.readFile(filePath, function(error, content) {
                    if (error) {
                        response.writeHead(500);
                        response.end();
                    }
                    else {
                        response.writeHead(200, { 'Content-Type': that.getContentType(filePath) });
                        response.end(content, 'utf-8');
                    }
                });
            }
            else {
                response.writeHead(404);
                response.end();
                throw 'The Ripley internal web server was not able to server the file "' + filePath + '".';
            }
        });
         
    }).listen(this.port);
    
    // exit if an error was raised after starting http server
    httpServer.on('error', function(e) {
        throw 'Error while starting Ripley Web Server: ' + e.message + "\n";    
    });

    this.logger.log('Web GUI is listening at ' + this.getRipleyUrl());
    
    return httpServer;
}

HttpServer.prototype.getContentType = function(filePath) {
    var extensionName = path.extname(filePath);

    switch (extensionName) {
        case '.js':
            return 'text/javascript';
        case '.css':
            return 'text/css';
        default :
            return 'text/html';
    }
}


HttpServer.prototype.getFilePath = function(request){
    
    var filePath = this.webDirectory + request.url;
    
    if ( filePath ===  this.webDirectory + '/' ) {
        filePath = this.webDirectory + '/index.html';
    }
    
    return filePath;
}

HttpServer.prototype.getRipleyUrl = function() {
    return 'http://' + os.hostname().toLowerCase() + ':' + this.port + '/';
}

// total path of ripley "gui" dir.
// "class" is removed from end of string since in uncompressed state
// HttpServer.js resides in dir class/ (dev)
HttpServer.prototype.getWebDirectory = function() {
    var ripleyJsHome = __dirname.replace(/\/class$/g,'')
    
    return ripleyJsHome + "/gui";
}

// node.js module export
module.exports = HttpServer;
