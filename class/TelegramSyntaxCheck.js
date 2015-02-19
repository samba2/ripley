var Telegram = require('./Telegram.js');


function TelegramSyntaxCheck(telegObj, telegramPath) {
    this.telegObj = telegObj;
    this.telegramPath = telegramPath;
    this.telegDict;
    this.bufferVarDict = {};
    
    this.setTelegDict.call(this, this.telegObj);
    this.fillBufferVarDict.call(this, '');
};


TelegramSyntaxCheck.prototype.setTelegDict = function(telegObj){
    // borrow this method without using Telegrams constructor
    this.telegDict = Telegram.prototype.createTelegramDict(telegObj);
}

TelegramSyntaxCheck.prototype.fillBufferVarDict = function(){
    var that = this;

    this.telegDict.forEach(function(telegLine, index) {

        if ( telegLine.value.isTelegramVariable() ) {
            plainVarName = telegLine.value.getPlainVariableName();

            if ( plainVarName.isBufferVariable() ) {
                that.bufferVarDict[plainVarName] = 1;
            }
        }
    });
}


TelegramSyntaxCheck.prototype.checkBufferKeys = function(bufferKeyVal){
    var plainVarName;
    
    if ( this.hasBufferVars() ) {
        if ( bufferKeyVal === null ) {
            throw 'The telegram "' + this.telegramPath +
                  '" contains buffer variables. However, the global "bufferKey" parameter is not defined.\n';
        }
        
        if ( ! this.bufferVarDict[ bufferKeyVal.getPlainVariableName() ] ) {
            throw 'The global buffer key "' + bufferKeyVal + '" can not be found in the buffer variables of telegram "' + this.telegramPath + '".\n';
        }
    }
}

TelegramSyntaxCheck.prototype.hasBufferVars = function (){
    if ( ! isEmptyObject(this.bufferVarDict) ) {
        return true;
    }
    return false;
}


/*
 * See if teleg offset and length definition are matching
 * @class Telegram
 * @method checkDefinition
 */ 
TelegramSyntaxCheck.prototype.checkDefinition = function (){
    var nextExpectedOffset,
                 telegLine,
                     index,
                     that = this;
    
    this.telegDict.forEach(function(telegLine, index) {
        if ( telegLine.offset !== 1 && telegLine.offset !== nextExpectedOffset ) {
            throw "Error in the defintion of telegram \"" + that.telegramPath 
                  + "\". The telegram offset and length definition is wrong. \ Error is around line '" + index + "'.";
        }
        else {
            nextExpectedOffset = telegLine.offset + telegLine.length;
        }
    }) 
}


//~ telegVariablesSizeDict : varName
                              //~ - length: 12
                              //~ - telegFound: telegname
TelegramSyntaxCheck.prototype.checkVariablesSizes = function (telegVariablesSizeDict){
    var that = this,
        currentVal,
        plainVariableName;
        
    this.telegDict.forEach(function(telegLine, index) {
        currentVal = telegLine.value;
        
        if ( currentVal.isTelegramVariable() ) {
            plainVariableName = currentVal.getPlainVariableName();
                
            if ( ! plainVariableName.isRipleyInternalVariable() ) {
            
                if ( telegVariablesSizeDict[currentVal] && 
                     telegVariablesSizeDict[currentVal]["length"] !== telegLine.length ) {

                    throw 'Telegram "' + that.telegramPath + '" has variable "' + currentVal + '" defined with a length of ' + telegLine.length + '. ' +
                          'However, telegram "' +  telegVariablesSizeDict[currentVal]["telegFound"] + 
                          '" defines the same variable with a length of ' +  telegVariablesSizeDict[currentVal]["length"] +'.\n';
                }
                else {
                    // init object
                    if ( ! telegVariablesSizeDict[currentVal] ) {
                        telegVariablesSizeDict[currentVal] = {};
                    }

                    telegVariablesSizeDict[currentVal]["length"] = telegLine.length;
                    telegVariablesSizeDict[currentVal]["telegFound"] = that.telegramPath;
                }
            }
        }
    });
}

TelegramSyntaxCheck.prototype.checkRipleyInternalVariablesSize = function (configObj){
    var that = this,
        ripleyInternalVarValue,
        plainVariableName;
    
    this.telegDict.forEach(function(telegLine, index) {
        currentVal = telegLine.value;
        
        if ( currentVal.isTelegramVariable() ) {
            plainVariableName = currentVal.getPlainVariableName();
                
            if ( plainVariableName.isRipleyInternalVariable() ) {
                ripleyInternalVarValue = Telegram.prototype.getRipleyInternalVariableValue(plainVariableName, configObj);
                
                if ( ripleyInternalVarValue === null ) {
                    throw 'The Ripley internal variable "' + currentVal + '" of telegram "' + that.telegramPath + '" is not supported.\n';
                }
                else if ( telegLine.length !== ripleyInternalVarValue.length ) {
                    throw 'The Ripley internal variable "' + currentVal + '" of telegram "' + that.telegramPath + 
                          '" has a configured length of ' + telegLine.length + '. The actual content is "' + ripleyInternalVarValue + 
                          '" with a length of ' + ripleyInternalVarValue.length + '. Please adjust this.\n';
                }
            }
        }
    });
}


TelegramSyntaxCheck.prototype.getTelegramPath = function (){
    return this.telegramPath;
}

// node.js module export
module.exports = TelegramSyntaxCheck;
