function Overview(receivedData, socket){
    this.receivedData = receivedData || null;
    this.socket = socket;
    this.ripleyOverViewDataArray = jQuery.parseJSON(receivedData);
    this.sendTriggers = {};
    
    this.IMG_BUTTON_UP = './media/arrow_right.png';
    this.IMG_BUTTON_DOWN = './media/arrow_right_gray.png';
}

Overview.prototype.drawEventDivs = function() {
    var that = this;
    
    $('#content').addClass("normal");

    jQuery.each( this.ripleyOverViewDataArray, function(index, eventObj) {
        var eventName = eventObj.name,
            eventStatus = eventObj.status || '',
            eventDirection = eventObj.direction || '',
            eventDescription = eventObj.description || '',
            eventFirstAction = eventObj.firstAction || '',
            divData;
        
        divData = '<div class="overviewDiv">';
        divData += '<table>';
        divData += '<tr>';
        divData += '<td><span class="overviewEventName">' + eventName + '</span>';
        
        if ( eventDirection === "send" ) {
            divData += '<span class="mousePointer" title="Trigger ' + eventFirstAction + '"id="spanSend_' + eventName +'">' + 
                           '<img class="overviewImgTriggerEvent" src="' + that.IMG_BUTTON_UP + '"</img>' + 
                       '</span>';

            that.sendTriggers['spanSend_' + eventName] = eventFirstAction;
        }
        divData += '<span class="overviewEventStatus">' + eventStatus + '</span>';
        
        divData += '</td>';
        divData += '</tr>';
        divData += '<tr>';
        divData += '<td class="overviewEventDesc">' + eventDescription + '</td>';
        divData += '</tr>';
        divData += '</table>';
        
        // create div to append buffer table for this status later
        if ( eventStatus ) {
            divData += '<div id="divBufferDataStatus_' + eventStatus + '"></div>';
        }
        
        divData += '</div>';
        $('#content').append(divData);
    }); 

    this.registerClickHandlerForSendTriggers();
}

Overview.prototype.registerClickHandlerForSendTriggers = function() {
    var that = this;
    
    jQuery.each( this.sendTriggers, function( idName, sendAction) {
        
        $('#' + idName ).click(function() {
            that.socket.emit('eventTriggerSendForAction', sendAction);
        });
 
        $('#'+ idName).mouseup(function(){
            $(this).children("img").attr('src', that.IMG_BUTTON_UP );
        }).mousedown(function(){
            $(this).children("img").attr('src', that.IMG_BUTTON_DOWN);
        });
    });
}
