$(document).ready(function (){
    var hostname = window.location.hostname;
    
    var socket = io.connect('http://' + hostname),
        activeTab = new ActiveTab(),
        log = new Log(),
        configObj = { socket : socket,
                      activeTab : activeTab,
                      log : log },
                      
        generalRipleyData = new GeneralRipleyData(configObj),
        menuEvents = new MenuEvents(configObj),
        socketReceiveEvents = new SocketReceiveEvents(configObj);
        
        generalRipleyData.getData();                
        menuEvents.setupMenuEvents();
        socketReceiveEvents.setupReceiveEvents();
        
        //activate overview
        $('#idOverview').click();
});  
