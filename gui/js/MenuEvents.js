function MenuEvents(configObj){
    this.socket = configObj.socket;
    this.activeTab = configObj.activeTab;
    this.log = configObj.log;
    this.currentActiveSpan = '';
}

MenuEvents.prototype.setupMenuEvents = function(){
    var that = this;
    
    $('#idOverview').click(function() {
        that.toggleActiveMenuEntry("spanOverview");
        that.initContentDiv();        
        that.activeTab.setActiveTab("overview");

        that.socket.emit('eventGetOverviewData');
        // request buffer content here as well
        that.socket.emit('eventGetBufferContent');
    });

    $('#idBufferContent').click(function() {
        that.toggleActiveMenuEntry("spanBufferContent");
        that.initContentDiv();        
        that.activeTab.setActiveTab("bufferContent");
        that.socket.emit('eventGetBufferContent');
    });

    $('#idLog').click(function() {
        that.toggleActiveMenuEntry("spanLog");
        that.initContentDiv();        
        that.activeTab.setActiveTab("log");
        that.log.displayLogArray();
    });


    $('#idConfig').click(function() {
        that.toggleActiveMenuEntry("spanConfig");
        that.initContentDiv();        
        that.activeTab.setActiveTab("config");
        that.socket.emit('eventGetRipleyConfig');
    });
}


MenuEvents.prototype.toggleActiveMenuEntry = function( spanToActivate ){
    if ( this.currentActiveSpan ) {
        $('#' + this.currentActiveSpan).removeClass("active");
    }
    this.currentActiveSpan = spanToActivate;
    $('#' + spanToActivate).addClass("active");
}

MenuEvents.prototype.initContentDiv = function(){
    $('#content').empty();
    $('#content').removeClass();
}
