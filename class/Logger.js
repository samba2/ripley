function Logger(configObj) {
    this.socketController;
    this.configObj = configObj;
    this.setObjectController.call(this, configObj);    
};


// verbose level 1 = important
//             2 = more details (less important)
//             3 = all details (internal data)
Logger.prototype.log = function(string, messageVerboseLevel) {
    var messageVerboseLevel = messageVerboseLevel || 1,
        appVerboseLevel = this.configObj.getVerboseLevel(),
        formatedLogString;
        
    // only print output if verbose > 0
    if ( appVerboseLevel > 0 ) {
        if ( messageVerboseLevel <= appVerboseLevel ) {
            formatedLogString = this.getFormatedLogString(string, messageVerboseLevel);
            console.log(formatedLogString);
            this.sendToBrowser(formatedLogString);
        }
    }
}

Logger.prototype.getFormatedLogString = function(string, verboseLevel) {
    var date = new Date().toString("yyyy-MM-dd HH:mm:ss");    
    return date + " (" + verboseLevel + "): " + string;
}

Logger.prototype.logAndExit = function(string, exitLevel) {
    exitLevel = exitLevel || 1;
    
    console.log(string);
    process.exit(exitLevel);
}


Logger.prototype.setObjectController = function(configObj) {
    if ( configObj && configObj.getSocketController() ) {
        this.socketController = configObj.getSocketController();
    }
}

Logger.prototype.sendToBrowser = function(data) {
    if ( this.socketController ) {
        this.socketController.emitLogEntry(data);
    }
}

// node.js module export
module.exports = Logger;
