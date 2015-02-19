################ Functions ######################

function startNcServer {
    if [ -p "$NC_FIFO" ]; then
        rm "$NC_FIFO"
    fi    
    
    mkfifo "$NC_FIFO"
   
    # prevent FIFO EOF
    coproc cat > "$NC_FIFO"
    CAT_PID=$!
 
    # kill old instances
    killall nc 2>/dev/null
 
    # STDIN is passed into nc by named pipe
    cat $NC_FIFO | $NC -l $PCS_PORT 1>$NC_OUT &
    NC_PID=$!
}

function silentKill {
    local pid=$1
    kill -9 $pid >/dev/null 2>&1
}

function killNcServer {
    executeKillNcServer >/dev/null 2>&1
}

function executeKillNcServer {
    silentKill $CAT_PID
    sleep 0.01
    rm -f "$NC_FIFO"
    silentKill $NC_PID
}

function runRipley {
    local testCaseFile=$1
    callRipley "$testCaseFile" 2>/dev/null
    sleep 0.5
}

function callRipley {   
    local testCaseFile=$1
    
    $NODE $RIPLEY verbose=4 $TESTDIR/$testCaseFile >$RIPLEY_OUT  2>&1 &

    RIPLEY_PID=$!
    # sleep until the output file has some content
    while ! [ -s $RIPLEY_OUT ]; do
        sleep 0.05
    done
}


function killRipley {
    executeKillRipley >/dev/null 2>&1
}

function executeKillRipley {
    # wait until last data is written
    sleep 0.3

    if [ $RIPLEY_PID ]; then
        silentKill $RIPLEY_PID
    fi

    rm -f $RIPLEY_OUT
}

function getOutputFileName {
    local outputName=$1 # either nc_out or ripley_out

    if [ "$outputName" = "nc" ]; then
        echo "$NC_OUT"
    elif [ "$outputName" = "ripley" ]; then
        echo "$RIPLEY_OUT"
    else 
       echo "Wrong output name: $outputName" >&2
       exit 1
    fi
}

function outputContains {
    local outputName=$1 # either nc_out or ripley_out
    local searchString=$2
    local testId=$3
    local searchFile=
   
    sleep 0.03 # prevent occationally wrong grep results, no idea why this happens
    searchFile=`getOutputFileName "$outputName"`
    
    if [ $testId ]; then 
        echo -n "$testId, "
    fi
    
    echo -n "output of \"$outputName\" contains \"$searchString\"....." 
    egrep -a "$searchString" "$searchFile" >/tmp/debug.txt 2>&1
    RESULT=$?

    if [ $RESULT -eq 0 ]; then
       echo "OK"
    else 
       echo "FAILURE"
    fi      
}

function outputNotContains {
    local outputName=$1 # either nc_out or ripley_out
    local searchString=$2
    local testId=$3

    sleep 0.01 # prevent occationally wrong grep results, no idea why this happens
    searchFile=`getOutputFileName "$outputName"`
    
    if [ $testId ]; then 
        echo -n "$testId, "
    fi

    echo -n "output of \"$outputName\" NOT contains \"$searchString\"....." 
    egrep -a "$searchString" "$searchFile" >/tmp/debug.txt 2>&1
    RESULT=$?

    if [ $RESULT -ne 0 ]; then
       echo "OK"
    else 
       echo "FAILURE"
    fi      
}

function clearOutput {
    local outputName=$1 # either nc_out or ripley_out
    local searchFile=`getOutputFileName "$outputName"`
    
    echo "" > $searchFile
}

function sendToRipley {
    local msg=$1
    echo "$msg" > "$NC_FIFO"
}
