/*
 * Config class
 * Handles the emulation configuration, read in during emulation startup
 * 
 * @class Config
 */ 
var fs = require('fs');
var Yaml = require('yaml.js');
var CommandLineArguments = require('./CommandLineArguments.js');

function Config() {
    this.config;
    this.fillConfigObject.call(this, '');
};

Config.prototype.getConfigPath = function() {
    var commandLineArgs = new CommandLineArguments();
    return commandLineArgs.getConfigFilePath();    
}

// read conf. file + return json object
Config.prototype.fillConfigObject = function() {
    var fileData = fs.readFileSync(this.getConfigPath(), "utf-8");
    this.config = Yaml.eval(fileData);
}

// returns list of first actions of events. list is filtered by
// direction of emulation ("send" or "receive")
Config.prototype.getFirstActions = function(emuDirection) {
    var firstActions = [];
 
    for(var eventName in this.config.events){
        var event =  eval("this.config.events." + eventName),
        firstActionName = "";
        
        // get first defined action = active, sending action
        for(var actionName in event.actions){
            firstActionName = actionName;
            break;
        }
        if ( event.direction === emuDirection ) {
            var action = "events." + eventName + ".actions." + firstActionName;
            firstActions.push(action);
        }
    }
    return firstActions;
}

// input events.myEvent.*
// returns events.myEvent
Config.prototype.getEventName = function(configVariable) {
    var resultArr;
    
    resultArr = configVariable.match(/^(events\.\w+)/gi);
    return resultArr[0];
}


Config.prototype.getFirstActionOfEvent = function(eventName) {
    var event =  eval("this.config.events." + eventName),
        firstActionName = "";

    for(var actionName in event.actions){
        firstActionName = actionName;
        break;
    }
    
    return "events." + eventName + ".actions." + firstActionName;
}

/*
 * Return obj.name : eventname  e.g. sendData
 *        obj.firstAction : e.g. events.sendData.actions.firstEventAction
 *        obj.descripton : e.g. "An event to send data"
 *        obj.status : e.g. STATUS1000
 * */
Config.prototype.getOverviewDataArray = function() {
    var eventsArray = [],
        eventObj = {},
        event;
    
    
    for(var eventName in this.config.events){
        eventObj.name = eventName;
        eventObj.firstAction = this.getFirstActionOfEvent(eventName);

        event =  eval("this.config.events." + eventName);
        
        if ( event.description ) {
            eventObj.description = event.description;
        }
        if ( event.direction ) {
            eventObj.direction = event.direction;
        }

        if ( event.status ) {
            eventObj.status = event.status;
        }
        
        eventsArray.push(eventObj);
        eventObj = {};
    }
    
    return eventsArray;
}


Config.prototype.eventHasParamConfigured = function(configVariable, paramName) { 
    var eventName = this.getEventName(configVariable),
        result;
        
    result = eval("this.config." + eventName + "." + paramName);

    if ( result) {
        return true;
    }
    return false;
}

Config.prototype.getEventParamValue = function(configVariable, paramName) {
    var eventName = this.getEventName(configVariable);
    return eval("this.config." + eventName + "." + paramName);
}

Config.prototype.actionHasRunSectionConfigured = function(action) { 
    var result;
        
    result = eval("this.config." + action + ".run");

    if ( result) {
        return true;
    }
    return false;
}

//TODO loeschen
Config.prototype.getExternalDatasourceCommandLinesToExecute = function( action ){
    var assembledCommandLines = {},
        runSection = [],
        externalDatasourceCommandLine,
        that = this,
        dataSourceName;
            
        runSection = this.getRunSection(action);

        // first level is the array of externalDatasources and their parameters
        runSection.forEach(function(singleRunSectionEntry, cnt) {

            // this level processes one run section entry
            singleRunSectionEntry.forEach(function(entry , index) {

                // entry "0" is dataSource name which is resolved to the configured path
                if ( index === 0 ) {
                    dataSourceName = entry;
                    externalDatasourceCommandLine = that.getExternalCommandLinePath( dataSourceName );
                    
                    if ( ! externalDatasourceCommandLine ) {
                        throw Error('Error inside action "' + that.action + '": Could not find the path for data source "' + entry + 
                                    '". The path needs to be defined in the global "externalDatasource" section.\n' );
                    }
                }
                // append all other params as arguments
                else {
                    externalDatasourceCommandLine += " " + entry;
                }
            });
            assembledCommandLines[dataSourceName] = externalDatasourceCommandLine;
        });

    return assembledCommandLines;
}


Config.prototype.getRunSection = function(action) { 
    return eval("this.config." + action + ".run");
}


Config.prototype.getExternalCommandLinePath = function( dataSourceName ) { 
    return this.config.externalDatasource[ dataSourceName ];
}

Config.prototype.getCycleTimeSec = function(action) {
    if ( this.eventHasParamConfigured(action, 'cycleTime') ) {
        return this.getEventParamValue(action, 'cycleTime');
    }
    return this.config.cycleTime;
}


Config.prototype.getCycleTimeMilliseconds = function(action) {
    return this.getCycleTimeSec(action) * 1000;
}

Config.prototype.getEvents = function() {
    return this.config.events;
}

Config.prototype.getConfig = function() {
    return this.config;
}

// read conf. file + return array for web display
Config.prototype.getConfigArray = function() {
    return fs.readFileSync(this.getConfigPath(), "utf-8").toString().split("\n");
}


Config.prototype.toString = function() {
    console.log(this.config.toString());
}


// node.js module export
module.exports = Config;
