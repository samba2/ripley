require('./String.js');
var Config = require('./Config.js');
var Logger = require('./Logger.js');

/**
 * Telegram class
 * @class Telegram
 * @param (String) whole path to action, e.g. events.firstEvent.actions.sendGoodTelegram
 */ 
function Telegram(action, configObj) {
    this.action = action;
    
    this.configObj = configObj;
    this.logger = new Logger(configObj);

    this.buffer = configObj.getBuffer();
    this.conf = configObj.getConfig().getConfig();
        
    this.telegDict;
    this.dateFormat = this.conf.dateFormat;
    this.timeFormat = this.conf.timeFormat;
    this.hasVariablesDefined = false;

    // fill telegram data structure 
    var telegObj = eval("this.conf." + action + ".telegram");
    this.setTelegDict.call(this, telegObj);
}

/**
 * Create array of objects, each array element containing one line of
 * the telegram.
 * @class Telegram
 * @method createTelegramDict
 */ 
Telegram.prototype.createTelegramDict = function(telegObj) {
    var localDict = [];

    telegObj.forEach(function(singleLineArr, index) {
        var lineHash = new Object();
    
        singleLineArr.forEach(function(telegLineElement, idx) {
            if ( idx === 0 ) {
                lineHash['offset'] = telegLineElement;
            }
            else if ( idx === 1 ) {
                lineHash['length'] = telegLineElement;
            }
            else if ( idx === 2 ) {
                lineHash['value'] = telegLineElement;
            }
            else if ( idx === 3 ) {
                lineHash['comment'] = telegLineElement;
            }
        });
        localDict.push(lineHash);
    });

    return localDict;

}

Telegram.prototype.setTelegDict = function(telegObj) {
    this.telegDict = this.createTelegramDict(telegObj);
}


/**
 * Assemble the final telegram, ready to be send out
 * @class Telegram
 * @return {string}
 *  
 *  configObject content:
 *  mode: static/ withVars
 *  bufferKeyValue:
 *  directAnswerValues: { varname: val,
 *                       varname2: val2}
 *  
 **/
Telegram.prototype.getTelegramString = function ( configObject ) {
    var telegramString = "",
                  that = this, // preserve content of this for foreach loop
                length,
                mode = configObject.mode || "staticOnly",  // static mode is default
                value,
                variableName;

    this.telegDict.forEach(function(telegLine, index) {
        length = telegLine.length;
         value = telegLine.value;

        // test if value matches conf.variable like "${xyz}"
        if ( value.isTelegramVariable() ) {
            variableName = value.getPlainVariableName();
            
            // if static only ${...} vars are set to null string and later padded to
            // given length
            if ( mode === "staticOnly" ) {
                value = "";
            }
            else if ( mode === "withVariables" ) {
                that.logger.log("Found variable in telegram definition.", 3);
                
                if ( variableName.isRipleyInternalVariable() ) {
                    that.logger.log(that.getFillVariablesLogString(variableName, "ripley internal"), 3);
                    value = that.getRipleyInternalVariableValue(variableName);
                }
                else if (variableName.isBufferVariable() ) {
                    that.logger.log(that.getFillVariablesLogString(variableName, "buffer"), 3);
                    value = that.getBufferVariableValue(variableName, configObject.bufferKeyValue);
                }
                else if (variableName.isExternalVariable() ) {
                    that.logger.log(that.getFillVariablesLogString(variableName, "external"), 3);
                    value = that.getExternalVariableValue(variableName, configObject.externalVariables);
                }
                else {
                    that.logger.log(that.getFillVariablesLogString(variableName, "direct answer"), 3);
                    value = that.getDirectAnswerVariableValue(variableName, configObject.directAnswerValues);
                }
                
                that.logger.log("Finished filling of variable \"" + variableName + "\". Value is \"" + value + "\".", 2);
            }
        }
        
        if ( value.length > length ) {
            throw Error('Could not assemble telegram. Variable "' + variableName + '" has the value "' + value + '" with a length of ' + 
                         value.length + ' characters. However, the telegrams definition only allows a length of ' + length + '.');
        }
        
        // fill the remaining bytes with spaces (from left)
        value = value.lpad(" ", length);
        
        telegramString += value;
    })
    
    if ( mode === "withVariables" ) {
        this.logger.log("Built telegram string: \"" + telegramString + "\".", 3);
    }
    
    return telegramString;
}

Telegram.prototype.getRipleyInternalVariableValue = function(variableName, configObj) {
    var dateFormat = ( configObj ) ? configObj.dateFormat : this.dateFormat,
        timeFormat = ( configObj ) ? configObj.timeFormat : this.timeFormat,
        // configObj is only passed in by syntax checker
        isSyntaxCheck = ( configObj ) ? true : false;
        
    if ( variableName === "ripley_date" ) {
        return new Date().toString(dateFormat);
    }
    else if ( variableName === "ripley_time" ) {
        return new Date().toString(timeFormat);
    }
    // like ${ripley_random_aA00a}
    else if ( variableName.isRipleyRandomVariable() ) {
        // no additional uniqueness tests if comming from syntax check
        if ( isSyntaxCheck ) {
            return this.getRipleyRandomString( variableName );
        } 
        else {
            return this.getBufferUniqueRipleyRandomString( variableName );
        }
    }
    else {
        return null;
    }
}


Telegram.prototype.getBufferVariableValue = function(variableName, bufferKeyValue) {

    // converts "buffer_varname" to "varname"
    var variableName = variableName.removePrefix("buffer_"),

         variableVal = this.buffer.getValue(bufferKeyValue, variableName);

    if ( variableVal ) {
        this.logger.log("Found buffer data for buffer key value \"" + bufferKeyValue + "\" and variable \"" + variableName 
            + "\", value is \"" + variableVal + "\"", 2);
        return variableVal;
    }
    else {
        this.logger.log("Could not find data for variable \"" + variableName + "\" in buffer.");
        return "";
    }
}


/**
 * Get value for external variables
 * 
 * @param variableName - String of the format "external_datasourceName_variableName"
 * @param externalVariables - Object with read in data, stored by datasourceName -> variableName = value
 * 
 * @return value
 */
Telegram.prototype.getExternalVariableValue = function( variableName, externalVariables ) {

    var variableName = variableName.removePrefix("external_"),
         variableVal,
         splitArr,
         dataSourceName,
         variableName;
         
         // cut datasource name and variale name into pieces
         splitArr = variableName.split("_");
         dataSourceName = splitArr[0];
         variableName = splitArr[1];
         
         
    if ( ! externalVariables[dataSourceName] ) {
        this.logger.log('Data source "' + dataSourceName + '" can not be found in external variables output.', 3);
        return "";
    }
     
    variableVal = externalVariables[dataSourceName][variableName];

    if ( variableVal ) {
        this.logger.log("Found external data for variable \"" + variableName  + "\", value is \"" + variableVal + "\"", 2);
        return variableVal;
    }
    else {
        this.logger.log("Could not find data for variable \"" + variableName + "\" in output of external program.");
        return "";
    }
}


Telegram.prototype.getDirectAnswerVariableValue = function(variableName, rcvVars) {
    
    if ( rcvVars[variableName] ) {
        return rcvVars[variableName];
    }
    return "";
}


Telegram.prototype.hasBufferKeyDefined = function() {
    var bufferKeyVarName;
    
    if ( this.getBufferKeyVariableName() ) {
        bufferKeyVarName = this.getBufferKeyVariableName().getPlainVariableName();
        
        if ( this.hasVariableDefined(bufferKeyVarName) ) {
            return true;
        }
    }
    return false;
}

// check if telegram has the given variable defined
Telegram.prototype.hasVariableDefined = function(variableName) {
    var variablesDict = this.getVariablesDict();
    
    if ( variablesDict[variableName] ) {
        return true;
    }
    return false;
}

/**
 * Return if existing the next action of the objects action
 * @class Telegram
 * @return {string}  complete path to action e.g. events.event1.actions.rcvRecipt
 */ 
Telegram.prototype.getNextAction = function() {
    var isNext = false,
        myActionName = this.getMyActionName();
    
    for ( var currentActionName in this.getAllActionsOfThisEvent() ) {
        if ( currentActionName === myActionName ) {
            isNext = true;
        }
        else if ( isNext ) {
            return this.getThisEventsActionPath() 
                   + "." + currentActionName;
        }
    }
}

Telegram.prototype.getPreviousAction = function() {
    var previousAction;
    
    for ( var currentActionName in this.getAllActionsOfThisEvent() ) {
        if ( currentActionName === this.getMyActionName() ) {
                return this.getThisEventsActionPath()
                        + "." + previousAction;
        }
        previousAction = currentActionName;
    }
    
    return null;
}

Telegram.prototype.hasPreviousAction = function() {
    var previousAction = this.getPreviousAction();
    
    if ( previousAction !== null ) {
        return true;
    }
    return false;
}

// returns something like "events.myEvent.actions"
Telegram.prototype.getThisEventsActionPath = function() {
    return this.action.substring(0, this.action.lastIndexOf('.'));  
}

// returns object to iterate over
Telegram.prototype.getAllActionsOfThisEvent = function() {
    return eval("this.conf." + this.getThisEventsActionPath()); 
}

// action name is last part of action, without leading dot
Telegram.prototype.getMyActionName = function() {
    var myActionName,
        lastDotIndex = this.action.lastIndexOf('.');

    // action name is last part of action, without leading dot
    myActionName = this.action.substr(lastDotIndex, this.action.length);
    myActionName = myActionName.replace('.', '');

   return myActionName;
}


Telegram.prototype.getFillVariablesLogString = function(varName, varType) {
    return "Variable \"" + varName + "\" is a " + varType + " variable. Trying to fill it.";
}

/** returns an object like
 * { testKey: { offset: 9, length: 8 },
 *    weight: { offset: 25, length: 4 } }
 *
 *  Information is used to chop out variable data from
 *  received telegram
 */
Telegram.prototype.getVariablesDict = function() {
    var variablesDict = {}, 
                value,
            resultArr,
            tmpObj;
        
    this.telegDict.forEach(function(telegLine, index) {
        value = String(telegLine.value);
        // ersetzen mit getPlainVariableName
        resultArr = value.match(/^\$\{(.+)\}$/);
        
        if ( resultArr ) {
            value = resultArr[1];
            tmpObj = {};
            
            tmpObj['offset'] = telegLine.offset;
            tmpObj['length'] = telegLine.length;

            variablesDict[value] = tmpObj;
        }
    })
    return variablesDict;
}


Telegram.prototype.getBufferKeyVariableName = function() {
    return this.conf.bufferKey;
}

Telegram.prototype.getBufferUniqueRipleyRandomString = function(telegramVariable) {
    var newRandomString = this.getRipleyRandomString(telegramVariable),
        maxRetries = this.configObj.MAX_REPEAT_RANDOM_VAR,
        retries = 1;

    while ( this.buffer.isBufferValue(newRandomString) && retries <= maxRetries ) {
        this.logger.log( 'Computed random string "' + newRandomString + '" is already existing in the buffer. ' + 
                         + retries + ". attempt to find unique random string.", 3 );
        
        newRandomString = this.getRipleyRandomString(telegramVariable);
        retries++;
    }

    return newRandomString;
}

Telegram.prototype.getRipleyRandomString = function(telegramVariable) {
    var resultArr = telegramVariable.match(/^ripley_random_(.+)$/),
        randomPattern = resultArr[1],
        i = 0,
        singlePatternChar,
        randomString = "";
        
    for (; i < randomPattern.length; i += 1) {
        singlePatternChar = randomPattern.charAt(i);
        
        if ( singlePatternChar === "a" ) {
            randomString += this.getRandomLowercaseCharacter();
        }
        else if ( singlePatternChar === "A" ) {
            randomString += this.getRandomUppercaseCharacter();
        }
        else if ( singlePatternChar === "0" ) {
            randomString += this.getRandomNumber();
        }
        // since the pattern is tested for a valid format this
        // shouldn't happen
        else {
            randomString += " ";
        }
    }
    
    return randomString;
}


Telegram.prototype.getRandomLowercaseCharacter = function() {
    var chars = "abcdefghiklmnopqrstuvwxyz",
        randomCharIndex;
    
    randomCharIndex = Math.floor(Math.random() * chars.length);
    return chars.substring(randomCharIndex,randomCharIndex+1);
}

Telegram.prototype.getRandomUppercaseCharacter = function() {
    return this.getRandomLowercaseCharacter().toUpperCase();
}

// random number between 0-9
Telegram.prototype.getRandomNumber = function() {
    return Math.floor((Math.random()*10));
}


// node.js module export
module.exports = Telegram;
