var Config = require('./Config.js');
var Telegram = require('./Telegram.js');
var Logger = require('./Logger.js');

/*
 * Session class
 * Simple in-memory store for receipt telegrams of an already send telegram
 * 
 * format: Session.store[actionPath]['dateAdded'] = 20120121201200
 *                                  ['key'] = keyOfTelegram
 * 
 * @class Session
 */ 
function Session(configObj) {
    this.configObj = configObj;
    this.config = configObj.getConfig().getConfig();
    
    this.sessionTimeout = this.config.sessionTimeout || 30;
    this.logger = new Logger(configObj);

    this.logger.log("Session timeout is set to " + this.sessionTimeout + " seconds", 2 );
    
    this.dateFormat = 'yyyyMMddHHmmss';
    this.store = {};
};

// add time + key
Session.prototype.add = function(actionPath) {
    this.store[actionPath] = this.store[actionPath] || {};
    this.logger.log("Adding session store entry for \"" + actionPath + "\"", 3);
    this.store[actionPath]['dateAdded'] = this.getDateObjectAsString(this.getNow());
}

Session.prototype.remove = function(actionPath) {
    delete this.store[actionPath];
}

//TODO: session timeout mit counter damit nach einem gesendeten telegramm nicht
// währed der sessiontime beliebig viele antwort-telegramme kommen koennen

/*
 * Expire entires older that expiryDate + sessionTimeout > now
 * @class Session
 */
Session.prototype.expireOldEntries = function() {
    this.logger.log("Trying to expire old session entries", 3);
    for(var entry in this.store){
        var now = this.getNow();

        var expiryDate = this.getDateStringAsObject(this.store[entry]['dateAdded']);
        // method "add" is method of date.js
        expiryDate.add({ seconds: this.sessionTimeout });    

        if ( Date.compare(now, expiryDate) === 1 ) {
            this.logger.log("Expiring " + entry + " in session storage");
            this.remove(entry);
        }
        else {
            this.logger.log("Session entry for " + entry + " is still valid. Doing nothing", 3);
        }
    }
}

Session.prototype.getStoredTelegrams = function() {
    var storedTelegDict = new Object();

    for ( var action in this.store) {
        var teleg = new Telegram(action, this.configObj);

        telegString = teleg.getTelegramString( {mode: "staticOnly"} );
        storedTelegDict[telegString] = action;
    }
    return storedTelegDict;
}

Session.prototype.getKey = function(actionPath) {
        return this.store[actionPath]['key'];
}

Session.prototype.getDateObjectAsString = function(dateObject) {
    return dateObject.toString(this.dateFormat);
}

Session.prototype.getNow = function() {
    return Date.today().setTimeToNow();
}

Session.prototype.getDateStringAsObject = function(dateString) {
    return Date.parseExact(dateString, this.dateFormat);
}

// node.js module export
module.exports = Session;
