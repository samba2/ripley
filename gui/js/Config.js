
function Config(receivedRipleyConfigData, configObj){
    this.receivedRipleyConfigData = receivedRipleyConfigData;
    this.configFilePath = configObj.configFilePath;
}

Config.prototype.displayRipleyConfig = function() {
    var ripleyConfigArray = jQuery.parseJSON(this.receivedRipleyConfigData);
    
    $('#content').addClass("normal top-padding");
    
    $('#content').append(this.configFilePath + ':<br><br>');
    
    jQuery.each( ripleyConfigArray, function(index, value) {
        value = value.replace(/ /g, "&nbsp;");            
        $('#content').append(value + "<br>");
    }); 
}
