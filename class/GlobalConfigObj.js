/*
 * create object with handles for all
 * global objects.
 */
    
function GlobalConfigObj() {
    this.sessionStore;
    this.buffer;
    this.config;
    this.socketController;
    this.connectionHandle;
    this.pcsToRipleyConnectionStatus;
    this.configFilePath;
    this.verboseLevel;
    
    this.DEFAULT_VERBOSE_LEVEL = 1;
    this.RIPLEY_VERSION = "0.7.0";
    this.DEFAULT_HTTP_PORT = 4275;
    this.MAX_REPEAT_RANDOM_VAR = 10;
};

GlobalConfigObj.prototype.getObject = function() {
    return this;
}

GlobalConfigObj.prototype.addConnectionHandle = function(connectionHandle) {
    this.connectionHandle = connectionHandle;
}

GlobalConfigObj.prototype.addSocketController = function(socketController) {
    this.socketController = socketController;
}

GlobalConfigObj.prototype.addBuffer = function(buffer) {
    this.buffer = buffer;
}

GlobalConfigObj.prototype.addSessionStore = function(sessionStore) {
    this.sessionStore = sessionStore;
}

GlobalConfigObj.prototype.addConfig = function(config) {
    this.config = config;
}

GlobalConfigObj.prototype.addConfigFilePath = function(configFilePath) {
    this.configFilePath = configFilePath;
}

GlobalConfigObj.prototype.getSessionStore = function() {
    return this.sessionStore;
}

GlobalConfigObj.prototype.getBuffer = function() {
    return this.buffer;
}

GlobalConfigObj.prototype.getConfig = function() {
    return this.config;
}

GlobalConfigObj.prototype.getConnectionHandle = function() {
    return this.connectionHandle;
}

GlobalConfigObj.prototype.getSocketController = function() {
    return this.socketController;
}

GlobalConfigObj.prototype.getConfigFilePath = function() {
    return this.configFilePath;
}

// either "connected" or "notconnected"
GlobalConfigObj.prototype.setPcsToRipleyConnectionStatus = function(connectionStatus) {
    this.pcsToRipleyConnectionStatus = connectionStatus;
}

GlobalConfigObj.prototype.getPcsToRipleyConnectionStatus = function() {
    return this.pcsToRipleyConnectionStatus;
}

GlobalConfigObj.prototype.ripleyIsConnectedToPcs = function() {
    if ( this.pcsToRipleyConnectionStatus === "connected" ) {
        return true;
    }
    return false;
}


GlobalConfigObj.prototype.setVerboseLevel = function(verboseLevel){
    this.verboseLevel = verboseLevel;
}

GlobalConfigObj.prototype.getVerboseLevel = function() {
    
    if ( this.verboseLevel ) {
        return this.verboseLevel;
    }
    return this.DEFAULT_VERBOSE_LEVEL;
}

GlobalConfigObj.prototype.getRipleyVersion = function() {
    return this.RIPLEY_VERSION;
}

GlobalConfigObj.prototype.getDefaultHttpPort = function() {
    return this.DEFAULT_HTTP_PORT;
}

// node.js module export
module.exports = GlobalConfigObj;
