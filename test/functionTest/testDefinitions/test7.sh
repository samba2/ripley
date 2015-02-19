startNcServer
runRipley test7.yml

# startup messages
outputContains "ripley" 'Trying to connect to 127.0.0.1:12001' "1a"
outputContains "ripley" 'Connected$' "1b"

# ripley startup, 
# wait 200 ms to let first cyle pass through
sleep 0.2
# request was received
outputContains "nc" 'REQUEST' "1c"
# no data in buffer yet
outputContains "ripley" 'Found 0 entries of 3 maximum allowed for status "A1"' "1d"

# filling buffer the quick way
sendToRipley "ANSWER  A100000140kg110m"
sleep 0.1
sendToRipley "ANSWER  A100000250kg120m"
sleep 0.1
sendToRipley "ANSWER  A100000360kg130m"
clearOutput "ripley"

sleep 2.1

outputContains "ripley" 'Found 3 entries of 3 maximum allowed for status "A1"'  "1e"
sendToRipley "RCVDATA DELETE"

# processing deletion of buffer entries
outputContains "ripley" 'Received string: "RCVDATA DELETE"' "1f"
outputContains "ripley" 'Removing "3" entries of status "A1" from buffer.' "1g"
outputContains "ripley" 'Buffer for status "A1" now contains "0" entires' "1h"
clearOutput "ripley"
sleep 2.1
outputContains "ripley" 'Found 0 entries of 3 maximum allowed for status "A1"' "1i"

# clean up
killRipley
killNcServer
