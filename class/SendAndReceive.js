/*
 * Common methods to sending and receiving of data
 * 
 */
 
var Logger = require('./Logger.js');
 
function SendAndReceive(configObj) {
    this.buffer = configObj.getBuffer();
    this.config = configObj.getConfig();
    this.socketController = configObj.getSocketController();
    this.configObj = configObj;
    
    this.logger = new Logger(configObj);
};

SendAndReceive.prototype.tryToLimitBufferEntriesOfStatus = function(status, action){
    if  (this.config.eventHasParamConfigured(action, 'maxEntriesOfStatusInBuffer')) {
        var maxEntriesOfStatus = this.config.getEventParamValue(action, 'maxEntriesOfStatusInBuffer');
        this.buffer.limitToMaxEntriesOfStatus(maxEntriesOfStatus, status);
    }
}

SendAndReceive.prototype.deleteBufferEntries = function(action) {
    var removeStatus,
        numberOfEntries;

    removeStatus = this.config.getEventParamValue(action, 'removeBufferEntriesOfStatus');
    numberOfEntries = this.buffer.getAmountOfEntriesWithStatus(removeStatus);

    this.logger.log("Removing \"" + numberOfEntries + "\" entries of status \"" + removeStatus + "\" from buffer.");

    this.buffer.removeBufferEntriesOfStatus(removeStatus); 
    
    numberOfEntries = this.buffer.getAmountOfEntriesWithStatus(removeStatus);
    this.logger.log("Buffer for status \"" + removeStatus + "\" now contains \""
        + numberOfEntries + "\" entires.", 3);
}

SendAndReceive.prototype.refreshWebGUI = function(){

    if ( this.buffer.hasChanged() ) {
        this.logger.log("Buffer has changed. Refreshing GUI.", 3);
        this.socketController.emitAnswerBufferContent();
    }
    else {
        this.logger.log("Buffer did not change. No GUI update.", 3);
    }
}

// node.js module export
module.exports = SendAndReceive;
