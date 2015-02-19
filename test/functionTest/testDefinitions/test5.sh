startNcServer
runRipley test5.yml

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
outputContains "ripley" 'The events previous status is set to "A1". Tyring to find oldest buffer key there.' "1e"
outputContains "ripley" 'Could not find an entry in buffer for previous status "A1". No telegram is sent.' "1f"

# filling buffer the quick way, 1.1s distance since ripley has a "second" resolution
sendToRipley "ANSWER  A100000140kg110m"
sleep 1.1
sendToRipley "ANSWER  A100000250kg120m"
sleep 1.1
sendToRipley "ANSWER  A100000360kg130m"
sleep 2.0

# cycle time is over, oldest buffer entry = A1000001 is picked to build telegram
outputContains "ripley" 'Cycle time is over. Trying to send teleg for action events.assemblyStep2.actions.sndRequestTeleg'  "1g"
outputContains "ripley" 'Found 3 entries of 3 maximum allowed for status "A1"'  "1h"
outputContains "ripley" 'Found oldest buffer entry of "A1000001" in buffer data of status "A1"' "1i"
outputContains "ripley" 'Built telegram string: "SNDDATA A100000140kg"' "1j"
outputContains "ripley" 'Updating status of buffer entry "A1000001" to "A2" \(this events status\)' "1k"

clearOutput "ripley"
clearOutput "nc"
sleep 4

# second cycle time is over, entry A1000001 is now in status A1
outputContains "ripley" 'Found oldest buffer entry of "A1000002" in buffer data of status "A1"' "1l"
outputContains "ripley" 'Updating status of buffer entry "A1000002" to "A2" \(this events status\)' "1m"
outputContains "ripley" 'Built telegram string: "REQUEST ".' "1n"


# clean up
killRipley
killNcServer
