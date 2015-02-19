var util = require('util');
var exec = require('child_process').exec;

var Telegram = require('./Telegram.js');
var SendAndReceive = require('./SendAndReceive.js');
var Logger = require('./Logger.js');


/**
 * Constructor
 * 
 * @param action    currentAction
 * @param configObj global config object containing references to buffer, 
 *                  config, session store... 
 */ 
function Send(action, configObj) {
    this.action = action; 
    this.connectionHandle = configObj.getConnectionHandle();
    this.sessionStore = configObj.getSessionStore();
    this.buffer = configObj.getBuffer();     
    this.config = configObj.getConfig();
    
    this.configObj = configObj;
    
    this.rcvdDirectAnswerValues = {};  
    this.externalVariables = {};
    this.bufferKeyValue;
        
    this.eventRepeatCycleIds = [];
    
    this.sendAndReceive = new SendAndReceive(this.configObj);
    
    this.logger = new Logger(configObj);
};


/**
 * Only for "send" events. Right after the emulator start, identify the "send" 
 * events + send the telegram for the first time. The setup the specified cycle 
 * to repeat the sendout.
 */
Send.prototype.initateTelegramSendout = function() {
    var events = this.config.getEvents();

    this.logger.log("searching for \"send\" events", 3);

    for(var eventName in events ){
        this.logger.log('parsing event "' + eventName + '"', 3);
        var event =  eval("events." + eventName);
        var firstActionName = "";
        
        if ( event.direction === "send" ) {
            this.logger.log('event "' + eventName + '" is a "send" event', 2);

            if ( event.onlySendOnGuiTrigger === "true" ) {
                this.logger.log('event "' + eventName + '" has property "onlySendOnGuiTrigger" defined. Event can only be sent via the Web GUI.', 2);
                continue;
            }

            // get first defined action = active, sending action
            for(var actionName in event.actions){
                firstActionName = actionName;
                break;
            }
            
            // build object path for action
            var action = "events." + eventName + ".actions." + firstActionName;
            
            // update action property of object
            this.setAction(action);
            this.sendTelegram();
                        
            // resending the telegram depending on cycle time is setup here
            this.setupEventRepeatCycle();
        }
        else if ( event.direction === "receive" ) {
            this.logger.log('event "' + eventName + '" is a "receive" event. Doing nothing', 2);
        }
    }
}


/**
 * Setup repeat cycle
 */
Send.prototype.setupEventRepeatCycle = function() {
    var cycleTimeSec = this.config.getCycleTimeSec(this.action),
        cycleTimeMillisec = this.config.getCycleTimeMilliseconds(this.action),
        intervalId,
        that = this;

    this.logger.log("Setting up event repeat cycle for " + this.action + ". Cycle time is " + cycleTimeSec + " seconds", 2);
    
    intervalId = setInterval(function(action, that) { 
        
        that.logger.log("Cycle time is over. Trying to send teleg for action " + action, 3);
        
        var sender = new Send( action, that.configObj);
        sender.sendTelegram();        

    }, cycleTimeMillisec, this.action, this);
    
    this.addIntervalIdToEventRepeatCycleArray(intervalId);
}


/**
 * First step of telegram send-out. Determine where 
 * the buffer key comes from: previous telegram, oldest entry of events previous status or none
 * 
 * @param stdout String with output of executed command
 * @param dataSourceName First Key to store the result in this.externalVariables
 * 
 */ 
Send.prototype.sendTelegram = function(rcvdBufferKeyValue, rcvdDirectAnswerValues) {
    var stopSendingOnStatusMaxAmount,
        previousStatus,
        previousStatusBufferKeyValue,
        status = this.getStatus();

    this.storeValuesToSendInObject( rcvdBufferKeyValue, rcvdDirectAnswerValues );
    
    this.logger.log("About to send telegramm for \"" + this.action + "\".", 4 );
     
    if ( this.isStopSendingOnStatusMaxAmountReached() ) {
        stopSendingOnStatusMaxAmount = this.getStopSendingOnStatusMaxAmount();

        this.logger.log("Status \"" + status + "\" has reached the configured maximum of \"" + 
             stopSendingOnStatusMaxAmount + "\" buffer entires. No telegram is send out.");

        return;
    }
    
    var teleg = new Telegram(this.action, this.configObj);
    
    if ( teleg.hasBufferKeyDefined() ) {
        this.logger.log("Telegram has a buffer key variable defined. Will need a defined buffer key for further actions.",3);

        if ( ! this.bufferKeyValue ) {
            this.logger.log("The previously received telegram did not contain a buffer key.", 3);

            if ( this.eventHasPreviousStatusDefined ) {
                previousStatus = this.getPreviousStatus();
                
                this.logger.log("The events previous status is set to \"" + previousStatus + "\". Tyring to find oldest buffer key there.", 2);
                previousStatusBufferKeyValue = this.buffer.getOldestBufferKeyValueOfStatus(previousStatus);
                
                if ( previousStatusBufferKeyValue ) {
                    this.logger.log("Found oldest buffer entry of \"" + previousStatusBufferKeyValue 
                        + "\" in buffer data of status \"" + previousStatus + "\"");
                    this.bufferKeyValue = previousStatusBufferKeyValue;
                    
                    this.preProcessTelegramTransmission();
                        
                    this.logger.log("Updating status of buffer entry \"" + this.bufferKeyValue + "\" to \""  
                        + status + "\" (this events status)");
                    this.buffer.updateStatus(this.bufferKeyValue, status);  

                    this.sendAndReceive.tryToLimitBufferEntriesOfStatus(status, this.action);  
                    this.sendAndReceive.refreshWebGUI();  // separate refresh since buffer was updated after sending teleg.
                }
                else {
                    this.logger.log("Could not find an entry in buffer for previous status \"" 
                        + previousStatus + "\". No telegram is sent.");
                }
            }
            else {
                this.logger.log("The event does not have a previous status defined. No telegram is sent.")
            }
        }
        else {
            this.logger.log("The buffer key is taken from the  previously received telegram. Initiate sending telegram.", 3);
            // buffer key value is already stored in object
            this.preProcessTelegramTransmission();
        }
    }
    else {
        // telegram without buffer key value
        this.preProcessTelegramTransmission();
    }
}


/**
 * Depending on whether or not a run section is existing, the defined commands
 * are executed and the telegram is send out.
 * Otherwise the telegram is sent straight out.
 * 
 * This construct had been necessary due to the async exec call.
 * 
 */
Send.prototype.preProcessTelegramTransmission = function() {
    var that = this,
        child,
        assembledCommandLines = {},
        outputLines = [],
        singleCommandLine,
        processedDataSourcesCnt = 0;

    if ( this.config.actionHasRunSectionConfigured(this.action) ) {
        this.logger.log("Action has run section configured. Trying to execute configured programs.", 2);

        assembledCommandLines = this.getExternalDatasourceCommandLinesToExecute();
        
        for ( var dataSourceName in assembledCommandLines ) {
            singleCommandLine = assembledCommandLines[dataSourceName];
            
            // push the two variables inside the scope of exec
            (function(dataSourceName, singleCommandLine) {
                
                child = exec( singleCommandLine, function (error, stdout, stderr) {
                    if (error !== null) {
                        throw Error('Error executing "' + singleCommandLine + '", error: '+ error);
                    }
                    
                    that.logger.log('Data source "' + dataSourceName + '" was executed with command line "' + singleCommandLine + '". Processing output.' , 3 );
                    that.fillExternalVariablesObject( stdout, dataSourceName );
                    processedDataSourcesCnt++;
                    
                    // all datasources where executed and stored to the externalVariables object. now
                    // we're ready to transmit the telegram
                    if ( processedDataSourcesCnt === Object.keys(assembledCommandLines).length ) {
                        that.transmitTelegram();
                    }
                });
                
            })(dataSourceName, singleCommandLine);
        }
    }
    else {
        this.logger.log("Action has no run section. Continuing to telegram sendout.", 3 );
        this.transmitTelegram();
    }
}


/**
 * Last step of telegram transmission - here the data is getting 
 * assembled and pushed through the wire.
 * 
 */
Send.prototype.transmitTelegram = function() {
    var teleg;
    
    this.logger.log("Sending telegram for action \"" + this.action + "\".");
    teleg = new Telegram(this.action, this.configObj);
    
    this.connectionHandle.write(teleg.getTelegramString({mode: "withVariables",
                                                         bufferKeyValue: this.bufferKeyValue,
                                                         directAnswerValues: this.rcvdDirectAnswerValues,
                                                         externalVariables: this.externalVariables }) + "\n");
                                            
    this.logger.log("Finished sending telegram.", 2);

    this.postProcessTelegramTransmission(teleg);
}


Send.prototype.postProcessTelegramTransmission = function(teleg) {

    if ( teleg.getNextAction() ) {
        this.logger.log("Found next action in this event.", 3)
        this.addToSessionStore(teleg.getNextAction());
    }
    
    if ( this.config.eventHasParamConfigured(this.action, 'removeBufferEntriesOfStatus') ) {
        this.sendAndReceive.deleteBufferEntries( this.action );
    }

    this.sendAndReceive.refreshWebGUI();
}

Send.prototype.isStopSendingOnStatusMaxAmountReached = function() {
    var status, 
        stopSendingOnStatusMaxAmount,
        cnt;
        
    if ( this.config.eventHasParamConfigured(this.action, 'stopSendingOnStatusMaxAmount')) {
        stopSendingOnStatusMaxAmount = this.getStopSendingOnStatusMaxAmount();
        status = this.getStatus();
                
        this.logger.log("Event has a maximum amount of \"" + stopSendingOnStatusMaxAmount + "\" allowed entries for status \"" + status + "\".", 3);
        cnt = this.buffer.getAmountOfEntriesWithStatus(status);
        this.logger.log("Found " + cnt + " entries of " +  stopSendingOnStatusMaxAmount + 
            " maximum allowed for status \"" + status + "\".", 2);
        
        if ( cnt >= stopSendingOnStatusMaxAmount ) {
            return true;
        }    
    }
    return false;
}

        
Send.prototype.getExternalDatasourceCommandLinesToExecute = function(){
    var assembledCommandLines = {},
        runSection = [],
        externalDatasourceCommandLine,
        that = this,
        varName,
        plainVarName,
        bufferValue,
        directAnswerValue,
        value = '',
        dataSourceName;
            
        runSection = this.config.getRunSection(this.action);
        // first level is the array of externalDatasources and their parameters
        runSection.forEach(function(singleRunSectionEntry, cnt) {
            // this level processes one run section entry
            singleRunSectionEntry.forEach(function(entry , index) {

                // entry "0" is dataSource name which is resolved to the configured path
                if ( index === 0 ) {
                    dataSourceName = entry;
                    externalDatasourceCommandLine = that.config.getExternalCommandLinePath( dataSourceName );
                    
                    if ( ! externalDatasourceCommandLine ) {
                        throw Error('Error inside action "' + that.action + '": Could not find the path for data source "' + dataSourceName + 
                                    '". The path needs to be defined in the global "externalDatasource" section.\n' );
                    }
                }
                // append all other params as arguments in surrounded by "
                else {
                    
                    if ( entry.containsTelegramVariable() ) {
                        plainVarName = entry.getPlainVariableName();
                        varName = entry.getVariableName();

                        if ( plainVarName.isBufferVariable() ) {
                                                        
                            value = that.tryResolvingBufferVarForScriptArgument( entry );
                        }
                        // direct answer variables
                        else if ( ! ( plainVarName.isRipleyInternalVariable() || plainVarName.isExternalVariable() ) ) {
                            
                            value = that.tryResolvingDirectAnswerVarForScriptArgument( entry );
                        }
                        else { 
                            throw Error('Error inside action "' + that.action + '", definition of datasource "'+ dataSourceName + 
                                        '": Variable "' + varName + '" is not supported as argument.');    
                        }

                        // assemble command line
                        externalDatasourceCommandLine += ' "' + value + '"';
                    }
                    // argument contains no suitable variable
                    else {
                        externalDatasourceCommandLine += ' "' + entry + '"';
                    }
                }
            });
            assembledCommandLines[dataSourceName] = externalDatasourceCommandLine;
        });

    return assembledCommandLines;
}


/**
 * Parse output of STDOUT, if a line contains a "key:value" pattern,
 * it is written to externalVariables.
 * 
 * @param stdout String with output of executed command
 * @param dataSourceName First Key to store the result in this.externalVariables
 **/
Send.prototype.fillExternalVariablesObject = function( stdout, dataSourceName ) {
    var outputLines = [],
        that = this;

    outputLines = stdout.split('\n');
    
    outputLines.forEach(function( singleOutputLine, index ){
        var outputLineArr = [],
            key,
            value;

        // does line contain non whitespace chars separated by ":"?
        if ( singleOutputLine.match(/\S+:\S+/) ) {

            outputLineArr = singleOutputLine.split(':');
            
            key = outputLineArr[0].trim();
            value = outputLineArr[1].trim();
            
            that.logger.log('Storing external data received from data source "' + dataSourceName + '". Key: "' 
                            + key + '", value: "' + value + '".', 2);

            // init
            if ( ! that.externalVariables[dataSourceName] ) {
                that.externalVariables[dataSourceName] = {};
            }
            
            that.externalVariables[dataSourceName][key] = value;
        }
        else {
            that.logger.log('External output result "' + singleOutputLine + '" has not a "key:value" pattern.', 3);
        
        }
    });
}


/**
 * Stores the values passed to sendTelegram in the Send-object for simplicity reasons.
 * 
 * @param rcvdBufferKeyValue       Buffer key value of previous telegram
 * @param rcvdDirectAnswerValues   Variables of the previous telegram which are not buffer vars 
 * 
 */
Send.prototype.storeValuesToSendInObject = function( rcvdBufferKeyValue, rcvdDirectAnswerValues ) {

    // store in object to simplify passing around the data
    if ( rcvdBufferKeyValue ) {
        this.bufferKeyValue = rcvdBufferKeyValue;
    }

    if ( rcvdDirectAnswerValues ) {
        this.rcvdDirectAnswerValues  = rcvdDirectAnswerValues;
    }
}

/**
 * Try to find value of variable in 'entry' inside the buffer.
 * Buffer key is already set inside this Send object.
 * 
 * @param entry Variable name like ${buffer_var}
 * @return resolvedValue 
 */    
Send.prototype.tryResolvingBufferVarForScriptArgument = function( entry ) {
    var resolvedValue,
        bufferValue,
        plainVarName = entry.getPlainVariableName(),
        plainVarNameWithoutPrefix = plainVarName.removePrefix("buffer_");
        varName = entry.getVariableName();

    this.logger.log('Variable "' + varName + '" is a buffer variable. Trying to find value in buffer.', 3);
    
    if ( this.buffer.isExistingBufferKey(this.bufferKeyValue) ) {
        
        if ( this.buffer.isKeyOfAnExistingBufferKey(this.bufferKeyValue, plainVarNameWithoutPrefix ) ) {
            // retrieve data from buffer
            bufferValue = this.buffer.getValue(this.bufferKeyValue, plainVarNameWithoutPrefix);

            // keep the non-variable content of the argument by replacing
            // the variable with the value.
            // org. argument "value:${buffer_weight}" > ${buffer_weight} = 12, resulting value: "value:12"
            resolvedValue = entry.replaceVariableNameWithContent(bufferValue);
        }
    }
    
    if ( ! resolvedValue ) {
        that.logger.log('Buffer key "' + this.bufferKeyValue + '" contains no key "' + plainVarName + '". Appending empty string.', 3);
        resolvedValue = '';
    }
    
    return resolvedValue;
}


/**
 * Tries to resolve the given entry as a direct answer var.
 * Data is retrieved from rcvdDirectAnswerValues object.
 * 
 * @param entry Variable name like ${var}
 * @return resolvedValue  
 * 
 */
Send.prototype.tryResolvingDirectAnswerVarForScriptArgument = function( entry ) {
    var plainVarName = entry.getPlainVariableName(),
        varName = entry.getVariableName(),
        directAnswerValue,
        resolvedValue;

    this.logger.log('Variable "' + varName + '" is a direct answer variable. Trying to find the value in the telegram previously received.', 3);

    if ( this.rcvdDirectAnswerValues[plainVarName] ) {
        directAnswerValue = this.rcvdDirectAnswerValues[plainVarName];
        resolvedValue = entry.replaceVariableNameWithContent(directAnswerValue);
    }
    
    if ( resolvedValue ) {
        this.logger.log('Argument "' + entry + '" has been changed to "' + resolvedValue + '".', 3);
    }
    else {
        this.logger.log('Variable "' + varName + '" can not be found in telegram received before. Appending empty string.', 3);
        resolvedValue = '';
    }
    
    return resolvedValue;
}
    

Send.prototype.eventHasPreviousStatusDefined = function() {
    if ( this.config.eventHasParamConfigured(this.action, 'previousStatus') ) {
        return true;
    }
    return false;
}

Send.prototype.addToSessionStore = function(nextAction) {
    this.logger.log("Next action for \"" + this.action + "\" is \"" + nextAction + "\". Added to session store.", 2);
    this.sessionStore.add(nextAction);
}

Send.prototype.addIntervalIdToEventRepeatCycleArray = function(intervalId) {
    this.eventRepeatCycleIds.push(intervalId);
}

Send.prototype.resetEventRepeatCycles = function() {
    this.eventRepeatCycleIds.forEach(function(eventRepeatCycleId, idx) {
        clearInterval(eventRepeatCycleId);            
    });
    
    this.logger.log("Cleared " + this.eventRepeatCycleIds.length + " event repeat cycles.", 3);
}


Send.prototype.getStopSendingOnStatusMaxAmount = function() {
    return this.config.getEventParamValue(this.action, 'stopSendingOnStatusMaxAmount');
}

Send.prototype.getStatus = function() {
    return this.config.getEventParamValue(this.action, 'status');
}

Send.prototype.getPreviousStatus = function() {
    return this.config.getEventParamValue(this.action, 'previousStatus');
}

Send.prototype.setAction = function(action) {
    this.action = action;
}

// node.js module export
module.exports = Send;
