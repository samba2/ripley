
// TODO ripley_random_xxx auf korrektes pattern format testen (a, A oder 0)

var Config = require('./Config.js');
var TelegramSyntaxCheck = require('./TelegramSyntaxCheck.js');


function SyntaxCheck(configObj) {
    this.configObj = configObj;
    this.config = configObj.getConfig();
    this.configStructure = this.config.getConfig();
    
    this.testParamValueUniqueDict = {};
    this.previousTelegHadBufferVars = false;
    this.currentTelegDirection;
    this.telegVariablesSizeDict = {};

    this.checkGlobalParams.call(this, '');
    this.checkEventParams.call(this, '');
}


SyntaxCheck.prototype.checkGlobalParams = function() {
    this.regexCheckParam({ "paramName" : "connectionType",
                           "regex" : '^passive$|^active$',
                           "errorMessage" : 'Allowed values are "passive" or "active"',
                           "mandatory" : true });

    this.testTypeOfParameterValue("description", ["string"]);

    this.regexCheckParam({"paramName" : "destinationHost",
                          "regex":                           
                              //IP address
                             '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}' +
                             '([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$' +
                             // hostname
                               // check host without toplevel domain e.g. "client.domain."
                             '|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*' +
                               // check top level domain eg. "com"
                             '([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$',
                         "errorMessage" : 'Please provide a valid IP-address or a valid hostname',
                         "mandatory" : false });

    this.integerCheckParam({ "paramName" : "port",
                             "min" : 1,
                             "max" : 65535,
                             "mandatory" : true
                          });                   

    this.testParam1RequiresParam2({ "paramName1" : "connectionType",
                                    "paramVal1" : "active",
                                    "paramName2" : "destinationHost",
                                    "paramVal2": null });

    this.integerCheckParam({ "paramName" : "httpPort",
                             "min" : 1,
                             "max" : 65535,
                             "mandatory" : false
                          });                   

    this.testCycleTimeIntegerCheck("cycleTime", true);

    this.regexCheckParam({ "paramName" : "bufferKey",
                           "regex" : '^\\$\{.+\}$',
                           "errorMessage" : 'Allowed is a variable of an existing ' +
                                            'telegram following that syntax: ${variablename}',
                           "mandatory" : false });

    this.regexCheckParam({ "paramName" : "bufferKey",
                           "regex" : '^\\$\{.+\}$',
                           "errorMessage" : 'Allowed is a variable of an existing ' +
                                            'telegram following that syntax: ${variablename}',
                           "mandatory" : false });
                           
    this.testDateString("dateFormat");
    this.testDateString("timeFormat");    
}


SyntaxCheck.prototype.checkEventParams = function() {
    var events = this.config.getEvents(),
        eventRoot,
        eventName;
        
        
    for( eventName in events ){
        eventRoot = "events." + eventName;

        this.testTypeOfParameterValue(eventRoot, ["object"]);
                
        this.regexCheckParam({ "paramName" : eventRoot + ".direction",
                               "regex" : '^send$|^receive$',
                               "errorMessage" : 'Allowed values are "send" or "receive"',
                               "mandatory" : true });
                               
        this.testParam1RequiresParam2({ "paramName1" : eventRoot + ".onlySendOnGuiTrigger",
                                        "paramVal1" : true,
                                        "paramName2" : eventRoot + ".direction",
                                        "paramVal2": "send" });

        this.testParam1RequiresParam2({ "paramName1" : eventRoot + ".stopSendingOnStatusMaxAmount",
                                        "paramVal1" : null,
                                        "paramName2" : eventRoot + ".status",
                                        "paramVal2": null });

        this.regexCheckParam({ "paramName" : eventRoot + ".onlySendOnGuiTrigger",
                               "regex" : '^true$|^false$',
                               "errorMessage" : 'Allowed values are "true" or "false"',
                               "mandatory" : false,
                               "dataTypes" : ["boolean", "string" ] });  

        this.testStatusValueRegexCheck(eventRoot + ".status");
        this.testStatusValueRegexCheck(eventRoot + ".removeBufferEntriesOfStatus");
        this.testStatusValueRegexCheck(eventRoot + ".previousStatus");
        
        this.integerCheckParam({ "paramName" : eventRoot + ".stopSendingOnStatusMaxAmount",
                                 "min" : 1,
                                 "max" : 5000,
                                 "mandatory" : false
                              });                   
                              
        this.integerCheckParam({ "paramName" : eventRoot + ".maxEntriesOfStatusInBuffer",
                                 "min" : 1,
                                 "max" : 5000,
                                 "mandatory" : false
                              }); 
                              
        this.testCycleTimeIntegerCheck(eventRoot + ".cycleTime", false);                                                
        this.testTypeOfParameterValue(eventRoot + ".description", ["string"]);

        this.testParam1RequiresParam2({ "paramName1" : eventRoot + ".onlySendOnGuiTrigger",
                                        "paramVal1" : true,
                                        "paramName2" : eventRoot + ".direction",
                                        "paramVal2": "send" });

        this.testPreviousStatusIsNotCurrentStatus(eventRoot);
        
        this.testParamValueUnique(eventRoot, "status");
        this.testParamValueUnique(eventRoot, "previousStatus");
        
        this.testActions(eventRoot);
    }
}


SyntaxCheck.prototype.testActions = function(eventRoot) {
    var actionsPath = eventRoot + '.actions',
        actionObj = this.getParameterValue( actionsPath ),
        telegramPath,
        telegObj,
        telegCheck;
        

    // inits for testBufferKeyToFillTelegramWithBufferDataIsPresent
    this.previousTelegHadBufferVars = false; // first telegram of action has no previous teleg.
    this.currentTelegDirection = this.getParameterValue( eventRoot + '.direction' );

    this.testForValidObject(actionsPath);    
    
    for(var singleAction in actionObj){
        telegramPath = actionsPath + "." + singleAction + ".telegram";        
        this.testForValidObject(telegramPath);
        
        telegObj = this.getParameterValue(telegramPath);
        telegCheck = new TelegramSyntaxCheck(telegObj, telegramPath);
        
        telegCheck.checkDefinition();
        telegCheck.checkBufferKeys(this.getParameterValue("bufferKey"));
        telegCheck.checkVariablesSizes(this.telegVariablesSizeDict);
        telegCheck.checkRipleyInternalVariablesSize({ dateFormat : this.getParameterValue("dateFormat"),
                                                      timeFormat : this.getParameterValue("timeFormat")});
 
        this.testBufferKeyToFillTelegramWithBufferDataIsPresent( eventRoot, telegCheck );
    }
}

SyntaxCheck.prototype.testBufferKeyToFillTelegramWithBufferDataIsPresent = function(eventRoot, telegCheck) {
    var previousStatusPath = eventRoot + '.previousStatus';
        
    // throw if no source for the buffer key can be found:
    //   - current telegram direction is send, initial value comes from event "direction"
    //   - current teleg. has buffer vars defined 
    //   - at least one of the following two is wrong:
    //        - previousStatus is not defined for this event
    //        - the previous telegram (must be a "receive"-teleg.) had no buffer vars
    if ( this.currentTelegDirection === "send" && telegCheck.hasBufferVars() && 
         ( ! ( this.parameterExists(previousStatusPath) || this.previousTelegHadBufferVars ) ) 
       ) {

        throw 'Telegram "' + telegCheck.getTelegramPath() + '" contains buffer variables. However, buffer data can not be reached '+ 
              'since the source of the buffer key is unclear. Fix this by either defining the previous reveive-telegram ' + 
              'to contain the buffer key or add a valid "previousStatus" to this event.\n';
    }           
       
    if ( telegCheck.hasBufferVars() ) {
        this.previousTelegHadBufferVars = true;
    }
    else {
        this.previousTelegHadBufferVars = false;        
    }
    this.testToggleDirection();
}

SyntaxCheck.prototype.testToggleDirection = function() {
    if ( this.currentTelegDirection === "send" ) {
        this.currentTelegDirection = 'receive';
    } 
    else {
        this.currentTelegDirection = 'send';
    }
}


SyntaxCheck.prototype.testForValidObject = function(fullParamName) {
    var objVal = this.getParameterValue(fullParamName);

    if ( !  this.parameterExists(fullParamName) ) {
        throw 'The parameter "' + fullParamName + '" does not exist.\n';
    }
    
    if ( objVal === null ) {
        throw 'The parameter "' + fullParamName + '" is configured improperly.\n';
    }
    
    this.testTypeOfParameterValue(fullParamName, ["object"]);
}


SyntaxCheck.prototype.testParamValueUnique = function(eventRoot, paramName) {
    var fullParamName = eventRoot + '.' + paramName,
        paramVal,
        existingFullParamName;
    
    if ( this.parameterExists(fullParamName) ) {
        paramVal = this.getParameterValue(fullParamName);
        
        //init
        if ( ! this.testParamValueUniqueDict[paramName] ) {
            this.testParamValueUniqueDict[paramName] = {};
        }
        
        if ( this.testParamValueUniqueDict[paramName][paramVal]) {
            existingFullParamName = this.testParamValueUniqueDict[paramName][paramVal];
            
            throw 'The parameter "' + paramName + '" with a value of "' + paramVal + '" has to be unique in the whole configuration. '+ 
            'Currently it is configured at "' + existingFullParamName + '" and "' + fullParamName + '".\n'; 
        }
        else {
            this.testParamValueUniqueDict[paramName][paramVal] = fullParamName;
        }
    }
}


SyntaxCheck.prototype.testPreviousStatusIsNotCurrentStatus = function(eventRoot) {
    var previousStatus = eventRoot + ".previousStatus",
        status = eventRoot + ".status";
        
    if ( this.parameterExists(previousStatus) && this.parameterExists(status)) {
        
        if ( this.getParameterValue(previousStatus) === this.getParameterValue(status) ) {
            throw 'Parameter "' + previousStatus + '" and "' + status + '" are not allowed to have the same value.\n';
        }
    }
}

SyntaxCheck.prototype.testStatusValueRegexCheck = function(paramName) {
    this.regexCheckParam({ "paramName" : paramName,
                           "regex" : '^[a-zA-Z0-9-_]+$',
                           "errorMessage" : 'A status has to be defined alphanumerical plus underscore (_) and minus (-).',
                           "mandatory" : false });
}

SyntaxCheck.prototype.testCycleTimeIntegerCheck = function(paramName, mandatory) {
    this.integerCheckParam({ "paramName" : paramName,
                             "min" : 2,
                             "max" : 3600,
                             "mandatory" : mandatory });
}


SyntaxCheck.prototype.testParam1RequiresParam2 = function(testConstraintObj) {
    var paramName1 = testConstraintObj.paramName1,
        paramVal1 = testConstraintObj.paramVal1,
        paramName2 = testConstraintObj.paramName2,
        paramVal2 = testConstraintObj.paramVal2,
        currentVal1,
        currentVal2,
        checkParam2 = false;
        
        if ( this.parameterExists(paramName1) ) {
            // only existence of param 1 is checked
            if ( paramVal1 === null ) {
                checkParam2 = true;
            }
            else {
                // compare supplied val1 with current vale, if equal
                // the check prerequisits are fulfilled
                currentVal1 = this.getParameterValue(paramName1);
                if ( currentVal1 === paramVal1 ) {
                    checkParam2 = true;
                }    
            }
        }
        
        // check prerequists are matched
        if ( checkParam2 ) {
            // param 2 is missing
            if (! this.parameterExists(paramName2) ) {
                throw this.getTestParam1RequiresParam2ErrorMessage(testConstraintObj);
            }

            // if supplied to the function, check if current val2 matches supplied val2
            if ( paramVal2 !== null ) {
                currentVal2 = this.getParameterValue(paramName2);

                if ( currentVal2 !== paramVal2 ) { 
                    throw this.getTestParam1RequiresParam2ErrorMessage(testConstraintObj);
                }
            }
        }
}
SyntaxCheck.prototype.getTestParam1RequiresParam2ErrorMessage = function(testConstraintObj) {
    var paramName1 = testConstraintObj.paramName1,
        paramVal1 = testConstraintObj.paramVal1,
        paramName2 = testConstraintObj.paramName2,
        paramVal2 = testConstraintObj.paramVal2,
        errorMessage;
        
        errorMessage = 'Parameter "' + paramName1 + '" ';
        
        if ( paramVal1 != null ) {
            errorMessage += 'with value "' + paramVal1 + '" ';
        }
        errorMessage += 'requires the parameter "' + paramName2 + '" ';

        if ( paramVal2 != null ) {
            errorMessage += 'with value "' + paramVal2 + '" ';
        }
        
        // remove last white space
        errorMessage = errorMessage.chop();
        
        errorMessage += '.\n';
        
        return errorMessage;
}


// DateFormat is always returning a valid object, no try catch test of 
// dateString possible
SyntaxCheck.prototype.testDateString = function(paramName) {
    
    this.testParameterExists(paramName, true);
    this.testTypeOfParameterValue(paramName, ["string"]);
}

SyntaxCheck.prototype.regexCheckParam = function(testRegexObj) {
    var paramName = testRegexObj.paramName,
        paramValue = this.getParameterValue(paramName),
        regex = testRegexObj.regex,
        errorMessage = testRegexObj.errorMessage,
        mandatory = testRegexObj.mandatory || false,
        dataTypes = testRegexObj.dataTypes || [ "string" ], // default datatype is string
        regexObj;

    this.testParameterExists(paramName, mandatory);
    this.testTypeOfParameterValue(paramName, dataTypes);

    // only regex if defined + string, enables regex check also for parameter which can be either string ("true")
    // or boolean (true)    
    if ( paramValue && typeof paramValue === "string" ) {
        regexObj = new RegExp(regex);

        if ( ! paramValue.match(regexObj) ) {
            throw "\"" + paramName + "\" is set to \"" + paramValue
            + "\". " + errorMessage + "\n"
        }   
    }
}

SyntaxCheck.prototype.integerCheckParam = function(testIntObj) {
    var paramName = testIntObj.paramName,
        intVal = this.getParameterValue(paramName),
        maxVal = testIntObj.max,
        minVal = testIntObj.min,
        mandatory = testIntObj.mandatory || false;

    this.testParameterExists(paramName, mandatory);
    this.testTypeOfParameterValue(paramName, ["number"]);

    if ( intVal ) {
        if ( parseInt(intVal) ==  intVal ) {
            if ( ! ( minVal <= intVal && intVal <= maxVal ) ) {
                throw "Parameter \"" + paramName + "\" is set to "
                      + intVal + ". The permited range is between "
                      + minVal + " and " + maxVal + ".\n";
            }
        }
        else {
            throw "Parameter \"" + paramName + "\" is set to \""
            + intVal + "\" but needs to be a number.\n";
        }   
    }
}

SyntaxCheck.prototype.testParameterExists = function(paramName, mandatory){
    if ( mandatory && ! this.parameterExists(paramName) ) {
        throw 'Parameter "' + paramName + '" is missing.\n';
    }
}

SyntaxCheck.prototype.testTypeOfParameterValue = function(paramName, expextedDataTypes){
    var expectedDataTypeFound = false,
        paramValue = this.getParameterValue(paramName),
        paramValueType = typeof paramValue,
        allowedDataTypesPrintString ="";

    if ( this.parameterExists(paramName) ) {
        paramValueType = typeof paramValue;
        expextedDataTypes.forEach(function(singleDatatype, index) {
            if ( paramValueType ===  singleDatatype ) {
                expectedDataTypeFound = true;
            }
            allowedDataTypesPrintString += singleDatatype + " ";
        });

        if (! expectedDataTypeFound ) {
            throw 'The data type of parameter "' + paramName + '" is wrong. The configured value "' + 
                  paramValue + '" has a data type of "' + paramValueType + '". The allowed data types are: "' +
                  allowedDataTypesPrintString.chop() + '".\n ';
        }
    }
}



SyntaxCheck.prototype.parameterExists = function(parameter){
    if ( eval("this.configStructure." + parameter ) ) {
        return true;
    }
    return false;
}

SyntaxCheck.prototype.getParameterValue = function(parameter){
    if ( eval("this.configStructure." + parameter ) ) {
        return eval("this.configStructure." + parameter );
    }
    return null;
}


// node.js module export
module.exports = SyntaxCheck;
