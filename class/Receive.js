var Config = require('./Config.js');
var Telegram = require('./Telegram.js');
var Send = require('./Send.js');
var SendAndReceive = require('./SendAndReceive.js');
var Logger = require('./Logger.js');


function Receive(data, configObj) {
    this.rcvString = data.toString().removeControlCharacters();

    this.buffer = configObj.getBuffer();
    this.config = configObj.getConfig();
    this.sessionStore = configObj.getSessionStore();
    this.configObj = configObj;   //save config obj
    
    this.logger = new Logger(configObj);
    this.sendAndReceive = new SendAndReceive(this.configObj);
    
    this.rcvdBufferValues = {};
    this.rcvdDirectAnswerValues = {};
    
    this.bufferKeyValue;
    this.action;
    this.actionType;
};


Receive.prototype.processReceivedData = function() {
    
    this.logger.log("Received string: \"" + this.rcvString + "\"");
                          
    this.sessionStore.expireOldEntries();
    this.identifyAction();
    this.fillReceivedValuesObjects();

    if ( this.actionType ) {
        this.printActionTypeLogMessage();
        this.performBufferActivities();        
        this.sendAnswerTelegram(this.rcvdDirectAnswerValues);
    }
        
    else {
        this.logger.log("Could not find matching action.");
    }
    
    this.sendAndReceive.refreshWebGUI();
}

Receive.prototype.identifyAction = function() {
    var rcvTelegrams,
        storedTelegrams,
        rcvActionTelegram,
        rcvActionStore;

    // either first time at a "receive" event...
    rcvTelegrams = this.getAllConfiguredReceiveActions();
    rcvActionTelegram = this.getReceivedAction(rcvTelegrams);

    // ...or valid receipt telegrams stored in the session store    
    storedTelegrams = this.sessionStore.getStoredTelegrams();

    rcvActionStore = this.getReceivedAction(storedTelegrams);
     
    if ( rcvActionTelegram ) {
        this.action = rcvActionTelegram;
        this.actionType = "receive";
    }
    else if ( rcvActionStore ) {
        this.action = rcvActionStore;
        this.actionType = "session";
    }
}

Receive.prototype.printActionTypeLogMessage = function(){
    // first time receive for an event
    if ( this.actionType === "receive" ) {
        this.logger.log("Identified action \"" + this.action + "\" (first time receive)");
    }    
    // received telegrams inside session store
    else if ( this.actionType === "session" ) {
        this.logger.log("Identified action \"" + this.action + "\" (telegram response)");
    }
}

Receive.prototype.performBufferActivities = function(){
    
    if ( this.config.eventHasParamConfigured(this.action, 'removeBufferEntriesOfStatus') ) {
        this.sendAndReceive.deleteBufferEntries( this.action );
    }
    
    if ( this.receivedTelegramContainsBufferVariables() ) {
        this.logger.log("Found buffer variables in telegram definition. Writing values to buffer.", 2);
        this.writeReceivedVariablesToBuffer(this.action);
        this.checkAndWriteStatusToBuffer();    
    }
    else {
        this.logger.log("No buffer variables found. No change to buffer.", 3);
    }
}

Receive.prototype.checkAndWriteStatusToBuffer = function() {
    var status;
    
    if (this.config.eventHasParamConfigured(this.action, 'status')) {
        this.logger.log("Event has status configured.", 3);
        
        status = this.config.getEventParamValue(this.action, 'status');
        
        if ( this.buffer.hasStatusSet(this.bufferKeyValue, status) ) {
            this.logger.log("For buffer entry \"" + this.bufferKeyValue + "\" the status is already set to \"" 
                + status + "\". Do not update status.", 3);
        }
        else {
            this.logger.log("Seeing status \"" + status + "\" the first time.");
            this.writeStatusToBuffer();
        }
        
        this.sendAndReceive.tryToLimitBufferEntriesOfStatus(status, this.action);  
    }
    else {
        this.logger.log("Event has no status configured. No status update in buffer.", 2);
    }
}

// return key/ value object of all possible receive telegrams incl. their
// static strings
Receive.prototype.getAllConfiguredReceiveActions = function() {
    var rcvTelegDict = new Object(),
        telegString,
        that = this;
    
    var firstActions = this.config.getFirstActions("receive");

    firstActions.forEach(function(action, index) {
        var teleg = new Telegram(action, that.configObj);

        telegString = teleg.getTelegramString( {mode: "staticOnly"} );

        rcvTelegDict[telegString] = action;
    })
    return rcvTelegDict;
}

// gets object with entries like
// "TELEGRAM STRING " : "events.eventname.actions.telegName
// and checks if received data is matching
Receive.prototype.getReceivedAction = function(telegrams) {
    var result, 
        that = this;

    Object.keys(telegrams).forEach(function(telegString, index) {
        var telegStringRegex = telegString.replace(/\s/g,'.');  //every space is a regex "."
        //received data starts with telegStringRegex
        telegStringRegex = new RegExp("^" + telegStringRegex);

        if ( telegStringRegex.test(that.rcvString) ) {
            result = telegrams[telegString];
        }         
    })

    return result;
}

Receive.prototype.sendAnswerTelegram = function() {
    var teleg = new Telegram(this.action, this.configObj);
    var nextAction = teleg.getNextAction();
    
    if ( nextAction ) {
        this.logger.log("Found answer telegram: " + nextAction );
        this.logger.log("Sending answer telegram.");

        var sender = new Send(nextAction, this.configObj);
        sender.sendTelegram(this.bufferKeyValue, this.rcvdDirectAnswerValues);   
    }
    else {
        this.logger.log("No answer defined after action \"" + this.action + "\". Doing nothing.");
    }
}

//get bufferkey from config + received value
Receive.prototype.setBufferKeyValueToObject = function() {
    var bufferKeyName,
        myConfig = this.config.getConfig();
    
    if ( myConfig.bufferKey ) {
        bufferKeyName = myConfig.bufferKey.getPlainVariableName();
        this.bufferKeyValue = this.rcvdBufferValues[bufferKeyName];
    }
}

Receive.prototype.writeReceivedVariablesToBuffer = function() {
    var plainVariableName,
        verboseLevel = this.configObj.getVerboseLevel();
    
    for (var varName in this.rcvdBufferValues){
            plainVariableName = varName.removePrefix("buffer_");
            
            this.logger.log("Writing to buffer: key: \"" + this.bufferKeyValue + "\", name: \"" 
                + plainVariableName + "\", value: \"" + this.rcvdBufferValues[varName] + "\"", 2);
            
            this.buffer.set(this.bufferKeyValue, plainVariableName, this.rcvdBufferValues[varName]);
    }

    if ( this.buffer.hasChanged() ) {
        this.logger.log("Buffer has changed.", 2);
        
        if ( verboseLevel >= 3 ) {
            this.buffer.dump();
        }
    }
    else {
        this.logger.log("Buffer did not change.", 3);
    }
}

//fills rcvdBufferValues with buffer_ - vars and
// rcvdDirectAnswerValues with all other vars
Receive.prototype.fillReceivedValuesObjects = function() {
    if ( this.action ) {
        var teleg = new Telegram(this.action, this.configObj),
            paramsDict = teleg.getVariablesDict(),
            telegValue;

        for (var param in paramsDict){
            telegValue = this.rcvString.substr(paramsDict[param].offset-1, paramsDict[param].length);

            if ( param.isBufferVariable() ) {
                this.rcvdBufferValues[param] = telegValue;
            }
            else {
                this.logger.log("Detected direct answer variable \"" + param + 
                    "\" with value \"" + telegValue + "\". Storing in memory.", 3);
                    
                this.rcvdDirectAnswerValues[param] = telegValue;
            }
        }
        
        this.setBufferKeyValueToObject();
    }
}

Receive.prototype.writeStatusToBuffer = function() {
    var status,
        verboseLevel = this.configObj.getVerboseLevel();
        
    if ( this.bufferKeyValue ) {
        status = this.config.getEventParamValue(this.action, 'status');
        
        this.buffer.updateStatus(this.bufferKeyValue, status);
        
        this.logger.log("Writing to buffer: key: \"" + this.bufferKeyValue + 
            "\", name: \"status\", value: \"" + status + "\"", 2);

        if ( verboseLevel >= 3 ) {
            this.buffer.dump();
        }
    }
    else {
        this.logger.log("No buffer key found for telegram of action \"" 
            + this.action + "\". No status update.", 3);
    }
}

Receive.prototype.receivedTelegramContainsBufferVariables = function() {
    if ( isEmptyObject(this.rcvdBufferValues) ) {
        return false;
    }
    else {
        return true;
    }
}

// node.js module export
module.exports = Receive;
