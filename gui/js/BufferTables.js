function BufferTables(receivedData){
    this.bufferHeadingsAndContent = jQuery.parseJSON(receivedData);
}

BufferTables.prototype.displayBufferContent = function() {
    // cleanup content
    $('#content').empty();
    $('#content').addClass("normal top-padding");

    if ( this.bufferHasData() ) {
        this.drawBufferContentTable( {contentId: 'content', 
                                 tableId: 'bufferTable'} );
    }
    else {
        $('#content').append("Buffer is empty.");
    }
}

BufferTables.prototype.drawBufferContentTable = function( configObj ) {
        var contentId = configObj.contentId,
            tableId = configObj.tableId,
            table,
            tableHeadingConfigArr = this.getTableHeadingConfigArray( this.bufferHeadingsAndContent['headings'] ),
            bufferContentArr = this.bufferHeadingsAndContent['content'];

        this.addEmptyTable(contentId, tableId);

        table = $('#' + tableId).dataTable( {
            "bJQueryUI": true,
            "aaData": bufferContentArr,
            "aoColumns" : tableHeadingConfigArr
        });
}

BufferTables.prototype.getTableHeadingConfigArray = function( bufferHeadingsArr ) {
    var tableHeadingConfigArr = [];
    
    jQuery.each( bufferHeadingsArr, function(index, headingName ) {
        tableHeadingConfigArr.push({sTitle: headingName});
    });
    
    return tableHeadingConfigArr;
}


BufferTables.prototype.addEmptyTable = function( contentId, tableId ) {    
    $('#' + contentId).append( '<table cellpadding="3" cellspacing="0" border="0" class="display" id="' + tableId + '"></table>' );
}


BufferTables.prototype.bufferHasData = function() {
    if ( this.bufferHeadingsAndContent['content'][0] ) {
        return true;
    }
    return false;
}


BufferTables.prototype.drawStatusTables = function() {
    var statusList = this.getAllCurrentStatusInBuffer(),
        statusCollumnIndex = this.getIndexOfStatusCollumn(),
        statusDivId,
        tableDivId,
        that = this;

    // remove all exiting tables, wildcard for divBufferDataStatusTable_*
    $("[id^=divBufferDataStatusTable_]").remove();

    jQuery.each( statusList, function(index, status) {
        statusDivId = 'divBufferDataStatus_' + status;
        tableDivId = 'divBufferDataStatusTable_' + status;
        
        if ( $('#' + statusDivId).length > 0 ) {
            $('#' + statusDivId).addClass("top-padding");   
            
            that.drawOverviewStatusTable({ contentId: statusDivId, 
                                           tableId: tableDivId,
                                           statusCollumn: statusCollumnIndex,
                                           statusValueToFilter: status });
        }
    });    
}

BufferTables.prototype.drawOverviewStatusTable = function(configObj) {
    var contentId = configObj.contentId,
        tableId = configObj.tableId,
        statusCollumn = configObj.statusCollumn || null,
        statusValueToFilter = configObj.statusValueToFilter || null,
        table,
        tableHeadingConfigArr = this.getTableHeadingConfigArray( this.bufferHeadingsAndContent['headings'] ),
        bufferContentArr = this.bufferHeadingsAndContent['content'];

        this.addEmptyTable(contentId, tableId);

        table = $('#' + tableId).dataTable( {
            "bJQueryUI": true,
            "aaData": bufferContentArr,
            "aoColumns" : tableHeadingConfigArr,
            "bPaginate": false,  // no multipages
            "aoColumnDefs": [{ "bVisible": false, "aTargets": [ statusCollumn ]}], // hide status collumn 
            "bInfo":false,  //no total count footer,
            "bFilter": false // hide "search" box
        });

        // status table contains always whole buffer, only filter for status displayed
        table.fnFilter( '^' + statusValueToFilter + '$', statusCollumn, true );

        // hide all toolbars (table header + footer bars)
        $('.ui-toolbar').css({"display": "none"});
        
        // set width of outer div to with of table (needed for IE)
        $('#' + contentId).css({ "width": $('#' + tableId).width() });
}


BufferTables.prototype.getAllCurrentStatusInBuffer = function() {
    var statusIndex = this.getIndexOfStatusCollumn();
        statusList = [],
        statusDict = {};
    
    //no "status" field in buffer data - return empty array
    if ( ! statusIndex) {
        return statusList;
    }

    // create object like { status1: 1, status2: 1}
    jQuery.each( this.bufferHeadingsAndContent.content, function(index, contentLine ) {
        statusDict[contentLine[statusIndex]] = 1;
    });
    
    // extract only the keys of the object ( e.g. status1 and status2) and put it to the array
    jQuery.each( statusDict, function(status, value ) {
        statusList.push(status);
    });
    
    return statusList;
}


BufferTables.prototype.getIndexOfStatusCollumn = function() {
    var headings = this.bufferHeadingsAndContent.headings;
    return jQuery.inArray("status", headings);
}
    
