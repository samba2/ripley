function SocketReceiveEvents(configObj){
    this.socket = configObj.socket;
    this.activeTab = configObj.activeTab;
    this.log = configObj.log;
    this.configObj = configObj;
}

SocketReceiveEvents.prototype.setupReceiveEvents = function() {
    that = this;
    
    // icon indicating connection status to ripley core
    this.socket.on('connect',function() {
        that.showConnectedIcon("ripleyConnectStatusIcon", "Connected to Ripley");
    });

    this.socket.on('disconnect',function() {
        that.showDisconnectedIcon("ripleyConnectStatusIcon", "Disconnected from Ripley");
    });

    this.socket.on('eventPcsConnectionStatus',function(connectionStatus) {
        if (connectionStatus === "connected") {
            that.showConnectedIcon("pcsConnectStatusIcon", "Connected to PCS");
        }
        else {
            that.showDisconnectedIcon("pcsConnectStatusIcon", "Disconnected from PCS");
        }
    });

    this.socket.on('disconnect',function() {
        that.showDisconnectedIcon("ripleyConnectStatusIcon", "Disconnected from Ripley");
    });
    
    this.socket.on('eventAnswerRipleyConfig', function (receivedData) {
        var config = new Config(receivedData, that.configObj);
        config.displayRipleyConfig();
    });
    
    this.socket.on('eventAnswerBufferContent', function (receivedData) {
        var bufferTables = new BufferTables(receivedData);

        if ( that.activeTab.getActiveTab() === "bufferContent" ) {
            bufferTables.displayBufferContent();
        }
        else if ( that.activeTab.getActiveTab() === "overview" ) {
            bufferTables.drawStatusTables();
        }
    });
    
    this.socket.on('eventLogEntry', function (receivedData) {
        that.log.addToLogArray(receivedData);
        
        if ( that.activeTab.getActiveTab() === "log" ) {
            that.log.displayLogArray();
        }
    });

    this.socket.on('eventAnswerOverviewData', function (receivedData) {
        var overview = new Overview(receivedData, that.socket);
        overview.drawEventDivs();
    });
    
    this.socket.on('eventAnswerGeneralRipleyData', function (receivedData) {
        var generalRipleyData = jQuery.parseJSON(receivedData);
        $('#spanEmuDescription').html( generalRipleyData.description );
        document.title = 'Ripley - ' + generalRipleyData.description;
        $('#spanRipleyVersion').html( generalRipleyData.version );
        $('#spanConfigFileName').html( generalRipleyData.configFileName );
        
        that.configObj.configFilePath = generalRipleyData.configFilePath;
    });
    
}

SocketReceiveEvents.prototype.showConnectedIcon = function(iconId, tooltipText) {
        this.doCommonIconActions(iconId, tooltipText);
        $('#' + iconId).addClass("statusConnected");
}


SocketReceiveEvents.prototype.showDisconnectedIcon = function(iconId, tooltipText) {
        this.doCommonIconActions(iconId, tooltipText);
        $('#' + iconId).addClass("statusNotConnected");
}

SocketReceiveEvents.prototype.doCommonIconActions = function(iconId, tooltipText) {
        $('#' + iconId).removeClass();
        $('#' + iconId).attr("title", tooltipText);    
}
