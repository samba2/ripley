var Logger = require('./Logger.js');

function Buffer(configObj) {
    this.buffer = {};
    this.allBufferVariableNames = [];
    this.oldBuffer = '{}';  // string representation of empty buffer for init
    
    this.logger = new Logger(configObj);
};

Buffer.prototype.set = function(key, varName, varVal) {
    this.setupKeyObject(key);
        
    this.buffer[key][varName] = varVal;    
}

Buffer.prototype.deleteEntry = function(key) {
    delete this.buffer[key];
}

Buffer.prototype.setupKeyObject = function(key) {
    if ( ! this.buffer[key]) {
        this.buffer[key] = {};
    }
}

Buffer.prototype.getValue = function(key, varName) {
    return this.buffer[key][varName];
}

Buffer.prototype.getValue = function(key, varName) {
    return this.buffer[key][varName];
}


Buffer.prototype.hasStatusSet = function(key, status) {
    
    if ( this.buffer[key]['status'] === status ) {
        return true;
    }
    else {
        return false;
    }
}


Buffer.prototype.updateStatus = function(key, status) {
    var statusTimestamp = this.getDateStringWithMilliseconds();
    
    this.set(key, 'status' , status);
    this.set(key, 'status timestamp', statusTimestamp);
}

Buffer.prototype.getAmountOfEntriesWithStatus = function(status) {
    var cnt=0;
    
    for (var key in this.buffer){
        if ( this.hasStatusSet(key, status) ) {
            cnt++;
        }
    }
    return cnt;
}

Buffer.prototype.removeBufferEntriesOfStatus = function(status) {
    for (var key in this.buffer){
        if ( this.hasStatusSet(key, status) ) {
            this.deleteEntry(key);
        }
    }
}

Buffer.prototype.removeBufferKeyValueOfStatus = function(key, status) {
    //check if entry really exists
    if ( this.buffer[key]['status'] === status ) {
        this.deleteEntry(key);
    }
}


Buffer.prototype.limitToMaxEntriesOfStatus = function(maxAllowedEntries, status) {
    var currentAmountOfEntries = this.getAmountOfEntriesWithStatus(status);
    var oldestBufferKeyValue;

    if ( ! this.isStatusMaxAllowedEntriesExceeded(maxAllowedEntries, status) ) {
        this.logger.log('The maximum allowed amount of "' + maxAllowedEntries + '" for status "'
            + status + '" is not reached yet. The current amount is "' + currentAmountOfEntries 
            + '". Leaving buffer untouched.', 3);
    }

    while ( this.isStatusMaxAllowedEntriesExceeded(maxAllowedEntries, status) ) {
        oldestBufferKeyValue = this.getOldestBufferKeyValueOfStatus(status);
        this.removeBufferKeyValueOfStatus(oldestBufferKeyValue, status);
        
        this.logger.log('For status "' + status + '" the maximum allowed entries in the buffer is set to "'
             + maxAllowedEntries + '". The current fill size was "' + currentAmountOfEntries + '".', 3);
        this.logger.log('Buffer entry "' + oldestBufferKeyValue + '" for status "' + status + '" was deleted.', 2);
    
        //update for while loop
        var currentAmountOfEntries = this.getAmountOfEntriesWithStatus(status);
        this.logger.log('The new amount of buffer entries for this status is "' + currentAmountOfEntries + '".', 3);
    }
}

Buffer.prototype.isStatusMaxAllowedEntriesExceeded = function(maxAllowedEntries, status) {
    if ( maxAllowedEntries < this.getAmountOfEntriesWithStatus(status) ) {
        return true;
    }
    return false;
}

Buffer.prototype.getOldestBufferKeyValueOfStatus = function(status) {
    var currentDate,
        savedDate,
        oldestKey;

    for (var key in this.buffer){

            if ( this.buffer[key]['status'] === status ) {
            // status is always written with "status timestamp" (Receive.js)
            currentDate = this.buffer[key]['status timestamp'];
            
            // initialize date
            if ( ! savedDate ) {
                savedDate = currentDate;
            }
            
            if ( currentDate <= savedDate ) {
                oldestKey = key;
            }
            
            savedDate = currentDate;
        }
    }
    return oldestKey;
}

Buffer.prototype.getDateStringWithMilliseconds = function() {
    var statusTimestamp = new Date().toString("yyyyMMddHHmmss"),
        milliSeconds = new Date().getMilliseconds();
        
    // fillup ms with leading "0"
    milliSeconds = milliSeconds.toString().lpad("0", 3);

    return statusTimestamp + milliSeconds;
}

Buffer.prototype.dump = function() {

    this.logger.log("Current buffer content: ", 3);
    
    for (var key in this.buffer){
        this.logger.log("key: \"" + key + "\"", 3);
        for (var varName in this.buffer[key]) {
            this.logger.log(" - name: \"" + varName
                + "\", value: \"" + this.buffer[key][varName] + "\"", 3);
        }
    }
}

// fill object variable allBufferVariableNames with all possible variable names
// in buffer. required for determing the headings of the buffer-gui view
Buffer.prototype.fillAllBufferVariableNames = function() {

    for (var key in this.buffer){
        for (var varName in this.buffer[key]) {
            if ( this.allBufferVariableNames.indexOf(varName) === -1 ) {
                this.allBufferVariableNames.push(varName);
            }
        }
    }
}

// return array of arrays with content of buffer
// if a buffer entry has a certain value not defined than a zero-length string is
// pushed to the array instead
Buffer.prototype.getContentArray = function() {
    var contentArray = [],
        lineArray = [],
        that = this,
        unformatedTimestamp;
        
    for (var key in this.buffer){
        this.allBufferVariableNames.forEach(function(varName, index) {
            if (that.buffer[key][varName]) {
                if ( varName === "status timestamp" ) {
                    unformatedTimestamp = that.buffer[key][varName];                    
                    lineArray.push(that.getFormatedTimeStamp(unformatedTimestamp));
                }
                else {
                    lineArray.push(that.buffer[key][varName]);
                }
            }
            else {
                lineArray.push("");
            }
        })
        contentArray.push(lineArray);
        lineArray = [];
    }
    
    return contentArray;
}


Buffer.prototype.getAllBufferVariableNames = function() {
    return this.allBufferVariableNames;
}

//compares old state with new state of buffer
// for simplicity comparison is done with JSON representation of object
Buffer.prototype.hasChanged = function() {
    var currentBuffer = JSON.stringify(this.buffer);
    
    if ( this.oldBuffer !== currentBuffer ) {
        this.oldBuffer = JSON.stringify(this.buffer);
        return true;
    }
    else {
        this.oldBuffer = JSON.stringify(this.buffer);
        return false;
    }
}

Buffer.prototype.isExistingBufferKey = function(string) {
    if ( this.buffer[string] ) {
        return true;
    }
    return false;
}

Buffer.prototype.isBufferValue = function(string) {
    var key,
        varName;
    
    for (var key in this.buffer){
        for ( varName in this.buffer[key]) {
            if ( this.buffer[key][varName] === string ) {
                return true;
            }
        }
    }
    
    return false;
}


Buffer.prototype.isKeyOfAnExistingBufferKey = function(bufferKeyVal, key) {
    if ( this.buffer[bufferKeyVal] ) {
        if ( this.buffer[bufferKeyVal][key] ) {
            return true;
        }
    }
    return false;
}


// converts 20120226213102798 to 
// 2012-02-26 21:31:02.798
Buffer.prototype.getFormatedTimeStamp = function ( timeStampString ) {
    var resultArr;
    //                                     YYYY     MM    DD    HH     MI   SS    MILLISEC                      
    resultArr = timeStampString.match(/^(\d\d\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d\d)$/);
    
    return resultArr[1] + "-" + resultArr[2] + "-" + resultArr[3] + " " + resultArr[4] + ":"
           + resultArr[5] + ":" + resultArr[6] + "." + resultArr[7];
}
    


// node.js module export
module.exports = Buffer;
