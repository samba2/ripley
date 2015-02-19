function GeneralRipleyData(configObj){
    this.socket = configObj.socket;
}

GeneralRipleyData.prototype.getData = function() {
    this.socket.emit('eventGetGeneralRipleyData');
    this.socket.emit('eventGetPcsConnectionStatus');
}
