startNcServer
runRipley test8.yml

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
sleep 2.1
# telegram was completely processed by ripley
outputContains "nc" 'ASSEMBLYSTEP3A100000140kg' "1g"
outputContains "ripley" 'The maximum allowed amount of "2" for status "A3" is not reached yet. The current amount is "1". Leaving buffer untouched.' "1h"

sendToRipley "ANSWER  A100000250kg120m"
sleep 1.1
sendToRipley "ANSWER  A100000360kg130m"

sleep 4.1
# telegram 2 did process
outputContains "nc" 'ASSEMBLYSTEP3A100000250kg' "1i"
# ... as well as telegram 3
outputContains "nc" 'ASSEMBLYSTEP3A100000360kg' "1j"

# buffer of status A3 was reduced by one, A1000001 as the oldest entry was deleted
outputContains "ripley" 'For status "A3" the maximum allowed entries in the buffer is set to "2". The current fill size was "3".' "1k"
outputContains "ripley" 'Buffer entry "A1000001" for status "A3" was deleted.' "1l"
outputContains "ripley" 'The new amount of buffer entries for this status is "2".' "1m"

clearOutput "ripley"
clearOutput "nc"

# testing event 'assemblyStep4' ( buffer size reducing for receive event)
# first teleg
sendToRipley "RCVTELEGB000000199kg"
sleep 1.1

# second teleg
clearOutput "ripley"
sendToRipley "RCVTELEGB000000288kg"
sleep 0.1
outputContains "ripley" 'The maximum allowed amount of "2" for status "B1" is not reached yet. The current amount is "2". Leaving buffer untouched.' "2a"
sleep 1.1

# last teleg
clearOutput "ripley"
sendToRipley "RCVTELEGB000000377kg"
outputContains "ripley" 'For status "B1" the maximum allowed entries in the buffer is set to "2". The current fill size was "3".' "2b"
outputContains "ripley" 'Buffer entry "B0000001" for status "B1" was deleted.' "2c"
outputContains "ripley" 'The new amount of buffer entries for this status is "2".' "2d"

# clean up
killRipley
killNcServer
