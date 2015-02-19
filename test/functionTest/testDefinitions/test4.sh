startNcServer
runRipley test4.yml

# startup messages
outputContains "ripley" 'Trying to connect to 127.0.0.1:12001' "1a"
outputContains "ripley" 'Connected$' "1b"

# ripley startup, first cycle sends telegram since buffer for status A1 is empty
sleep 0.1
outputContains "ripley" 'Found 0 entries of 3 maximum allowed for status "A1"' "1c"
outputContains "ripley" 'Finished sending telegram' "1d"
# request was received
outputContains "nc" 'REQUEST' "1e"
sendToRipley "ANSWER  A100000140kg110m"
outputContains "ripley" 'Writing to buffer: key: "A1000001", name: "status", value: "A1"' "1f"
clearOutput "ripley"
clearOutput "nc"
sleep 2.1

# cycle time is over, ripley finds 1 entry hence sending REQUEST telegram
outputContains "ripley" 'Found 1 entries of 3 maximum allowed for status "A1"' "1g"
outputContains "ripley" 'Finished sending telegram' "1h"
outputContains "nc" 'REQUEST' "1i"
sendToRipley "ANSWER  A100000240kg110m"
outputContains "ripley" 'Writing to buffer: key: "A1000002", name: "status", value: "A1"' "1j"
clearOutput "ripley"
clearOutput "nc"
sleep 2.1

# cycle time is over the third time, two entries of status A1 are detected. REQUEST is still send
outputContains "ripley" 'Found 2 entries of 3 maximum allowed for status "A1"' "1k"
outputContains "ripley" 'Finished sending telegram' "1l"
outputContains "nc" 'REQUEST' "1m"
sendToRipley "ANSWER  A100000340kg110m"
outputContains "ripley" 'Writing to buffer: key: "A1000003", name: "status", value: "A1"' "1n"
clearOutput "ripley"
clearOutput "nc"
sleep 2.1

# cycle time over, now the maximum of 3 entires is reached. no further REQUEST is send
outputContains "ripley" 'Found 3 entries of 3 maximum allowed for status "A1"' "1o"
outputContains "ripley" 'Status "A1" has reached the configured maximum of "3" buffer entires. No telegram is send out' "1p"
outputNotContains "nc" 'REQUEST' "1q"
sendToRipley "ANSWER  A100000440kg110m"
outputContains "ripley" 'Writing to buffer: key: "A1000004", name: "status", value: "A1"' "1r"
clearOutput "ripley"
clearOutput "nc"
sleep 2.1

# cycle time over, still no request send
outputContains "ripley" 'Found 4 entries of 3 maximum allowed for status "A1".' "1s"
outputContains "ripley" 'Status "A1" has reached the configured maximum of "3" buffer entires. No telegram is send out' "1t"
outputNotContains "nc" 'REQUEST' "1u"

# clean up
killRipley
killNcServer
