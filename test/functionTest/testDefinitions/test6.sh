startNcServer
runRipley test6.yml

# startup messages
outputContains "ripley" 'Trying to connect to 127.0.0.1:12001' "1a"
outputContains "ripley" 'Connected$' "1b"

outputContains "nc" '2SECONDS' "1c"
outputContains "nc" '5SECONDS' "1d"
outputContains "nc" '7SECONDS' "1e"

clearOutput "nc"
sleep 2

outputContains "nc" '2SECONDS' "1f"
outputNotContains "nc" '5SECONDS' "1g"
outputNotContains "nc" '7SECONDS' "1h"

sleep 3

outputContains "nc" '2SECONDS' "1i"
outputContains "nc" '5SECONDS' "1j"
outputNotContains "nc" '7SECONDS' "1k"

sleep 2

outputContains "nc" '2SECONDS' "1l"
outputContains "nc" '5SECONDS' "1m"
outputContains "nc" '7SECONDS' "1n"

# clean up
killRipley
killNcServer
