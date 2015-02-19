var fs = require('fs');
var Logger = require('./Logger.js');
var path = require('path');

function CommandLineArguments(configObj) {
    this.configObj = configObj;
    
    this.logger = new Logger(configObj);
};

CommandLineArguments.prototype.check = function() {
    var commandLineOptionsPresent = false,
        configFilePresent = false;
        that = this;
    
    process.argv.forEach(function(argument, idx) {
        // program params start at index 2
        if ( idx >= 2 ) {
            commandLineOptionsPresent = true;
            
            if ( argument.isOptionDefinition() ) {
                that.checkOption(argument);
            }
            else if ( that.isExistingFile(argument) ) {
                configFilePresent = true;
            }
            else {
                that.logger.logAndExit("\"" + argument + "\" is not a readable file.");
            }
        }
    })
    
    if ( commandLineOptionsPresent === false || configFilePresent == false ) {
        this.printHelpText();
        process.exit();
    }
    
}

CommandLineArguments.prototype.checkOption = function(argument) {
    var optionName,
        optionValue;

    optionName = argument.getOptionName();
    optionValue = argument.getOptionValue();
    
    if ( optionName === "verbose" ) {
        if ( ! this.isValidVerboseLevel(optionValue) ) {
            this.logger.logAndExit("The verbose level \"" + optionValue + "\" is not inside the allowed range of 0-4.");
        }
        else {
            this.configObj.setVerboseLevel(optionValue);
        }
    } 
    else {
        this.logger.logAndExit("The option \"" + optionName + "\" is not known.");
    }
}

CommandLineArguments.prototype.isExistingFile = function(filePath) {
    try { 
        fs.readFileSync(filePath, "utf-8") 
    }
    catch (err) {
        return false;
    }
    
    return true;
}


CommandLineArguments.prototype.isValidVerboseLevel = function(verboseLevel) {
    var configObj = { testValue: verboseLevel,
                      rangeStart: 0,
                      rangeEnd: 4};

    if ( this.isValidNumberRange(configObj) ) {
        return true;
    }
    return false;
}

CommandLineArguments.prototype.isValidNumberRange = function(configObj) {
    var testValue = configObj.testValue,
        rangeStart = configObj.rangeStart,
        rangeEnd = configObj.rangeEnd;

    if ( testValue >= rangeStart && testValue <= rangeEnd) {
        return true;
    }
    return false;
}

CommandLineArguments.prototype.getConfigFilePath = function() {
    var that = this,
        configFilePath;
    
    process.argv.forEach(function(argument, idx) {
        if ( idx >= 2 ) {
            if ( that.isExistingFile(argument) ) {
                configFilePath = argument;
            }
        }
    })
    
    // return absolute path
    return path.resolve(configFilePath);
}

CommandLineArguments.prototype.printHelpText = function() {
    var ripleyVersion = this.configObj.getRipleyVersion();
    
    console.log();
    console.log();
    console.log("  R I P L E Y - A Modest PLC-Emulator");
    console.log("             version " + ripleyVersion);
    console.log();
    console.log();
    console.log("  SYNOPSIS");
    console.log("    [OPTIONS] CONFIG-FILE");
    console.log("");
    console.log("");
    console.log("  OPTIONS");
    console.log("    verbose=NUM");
    console.log("      Define verbosity of the emulator. \"1\" is only for importent, high level messages,");
    console.log("      \"3\"  is for maximum RIPLEY information. \"4\" also displays the web server logs.");
    console.log("      \"0\" sets RIPLEY to be quite.");
    console.log("");
    console.log("  CONFIG-FILE");
    console.log("      The config file is written in \"YET ANOTHER MARKUP LANGUAGE\" (YAML) format.");
    console.log("      The available config options can be found in the RIPLEY documentation. ");
    console.log();
}

CommandLineArguments.prototype.toString = function() {
    console.log(this.data.toString());
}

// node.js module export
module.exports = CommandLineArguments;
