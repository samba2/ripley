
//pads left
String.prototype.lpad = function(padString, length) {
    var str = this;
    
    while (str.length < length) {
        str = padString + str;
    }
    
    return str.toString();
}

// remove last character
String.prototype.chop = function() {
    return this.slice(0, -1);
}

// remove newline, carriage return or tab
String.prototype.removeControlCharacters = function() {
    var str = this;
    return this.replace(/[\n\r\t]/g, ''); 
}

/**
 * Returns ${buffer_varname}
 */
String.prototype.getVariableName = function() {
    var str = this,
        resultArr;
    
    resultArr = str.match(/(\$\{.+\})/);
    return resultArr[1];
}


/**
 * Returns buffer_varname
 */
String.prototype.getPlainVariableName = function() {
    var str = this,
        resultArr;
    
    resultArr = str.match(/\$\{(.+)\}/);
    return resultArr[1];
}


String.prototype.ascendOneLevelInConfigHierachy = function() {
    return this.slice(0, this.lastIndexOf("."));
}

String.prototype.isTelegramVariable = function() {
    if (this.match(/^\$\{.+\}$/)) {
        return true;
    }
    return false;
}


String.prototype.containsTelegramVariable = function() {
    if (this.match(/\$\{.+\}/)) {
        return true;
    }
    return false;
}


String.prototype.isBufferVariable = function() {
    if (this.match(/^buffer_.+$/)) {
        return true;
    }
    return false;
}

String.prototype.isRipleyInternalVariable = function() {
    if (this.match(/^ripley_.+$/)) {
        return true;
    }
    return false;
}

String.prototype.isExternalVariable = function() {
    if (this.match(/^external_.+$/)) {
        return true;
    }
    return false;
}

String.prototype.isRipleyRandomVariable = function() {
    if (this.match(/^ripley_random_.+$/)) {
        return true;
    }
    return false;
}

String.prototype.removePrefix = function( prefix ) {
    var str = this,
        resultArr,
        regex;
    
    regex = new RegExp("^" + prefix + "(.+)$", "i")
    
    resultArr = str.match(regex) ;
    return resultArr[1];
}


String.prototype.replaceVariableNameWithContent = function( content ) {
    return this.replace(/\$\{.+\}/, content);
}


String.prototype.isOptionDefinition = function() {
    if (this.match(/^.+=.+$/)) {
        return true;
    }
    return false;
}


String.prototype.getOptionName = function() {
    var str = this,
        resultArr;
    
    resultArr = str.match(/^(.+)=.+$/);
    return resultArr[1];
}

String.prototype.getOptionValue = function() {
    var str = this,
        resultArr;
    
    resultArr = str.match(/^.+=(.+)$/);
    return resultArr[1];
}

String.prototype.isNode_ModulesRequest = function() {
    if (this.match(/^\/node_modules\/.+$/)) {
        return true;
    }
    return false;
}
