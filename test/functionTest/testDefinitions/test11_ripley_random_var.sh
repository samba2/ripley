startNcServer
runRipley test11_random_var.yml

# startup messages
outputContains "ripley" 'Trying to connect to 127.0.0.1:12001' "1a"
outputContains "ripley" 'Connected$' "1b"
outputContains "ripley" 'parsing event "emu2pcsEvent"' "1c"
# the only event defined is a receive event
outputContains "ripley" 'event "emu2pcsEvent" is a "receive" event. Doing nothing' "1d"

sendToRipley "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"
outputContains "nc" 'EMU2PCS RECEIVED12345678abcd[0-9]{14}[a-z][A-Z][0-9][0-9][a-z]DONE' "1e"

outputContains "ripley" 'Variable "ripley_random_aA00a" is a ripley internal variable. Trying to fill it.' "1f"
outputContains "ripley" 'Finished filling of variable "ripley_random_aA00a". Value is "[a-z][A-Z][0-9][0-9][a-z]".' "1g" 
outputContains "ripley" 'Built telegram string: "EMU2PCS RECEIVED12345678abcd[0-9]{14}[a-z][A-Z][0-9][0-9][a-z]DONE".' "1h"

# filling buffer with all possible numbers (one digit) to force ripley to run "find unique random string" loop
sendToRipley "PCS2EMU2ABCDEFGH0123456789"

outputContains "ripley" 'Variable "ripley_random_0" is a ripley internal variable. Trying to fill it.' "1i"
outputContains "ripley" 'Computed random string "[0-9]" is already existing in the buffer. 10. attempt to find unique random string.' "1j"
outputContains "nc" 'EMU2PCS [0-9]DONE' "1k"

#~ # clean up
killRipley
killNcServer
