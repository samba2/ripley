/*
 * Constructor
 */
function Log(){
    this.logArr = [];
    this.LOG_BUFFER_LINES = 300;
}

Log.prototype.addToLogArray = function(receivedData) {
    this.logArr.push(receivedData);
    
    while ( this.logArr.length > this.LOG_BUFFER_LINES ) {
        this.logArr.shift();
    }
}

Log.prototype.displayLogArray = function() {
    $('#content').empty();
    $('#content').addClass("small top-padding");
    
    jQuery.each( this.logArr, function(index, singleLogLine) {
        $('#content').append(singleLogLine + "<br>");
    }); 
}

