startNcServer
runRipley test3c_ripley_internal_vars.yml

# startup messages
outputContains "ripley" 'Trying to connect to 127.0.0.1:12001' "1a"
outputContains "ripley" 'Connected$' "1b"
outputContains "ripley" 'parsing event "emu2pcsEvent"' "1c"
# the only event defined is a receive event
outputContains "ripley" 'event "emu2pcsEvent" is a "receive" event. Doing nothing' "1d"

sendToRipley "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"
outputContains "nc" 'EMU2PCS RECEIVED12345678abcd[0-9]{14}DONE' "1e"
outputContains "ripley" 'Received string: "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"' "1f"

outputContains "ripley" 'Variable "ripley_date" is a ripley internal variable. Trying to fill it.' "1g"
outputContains "ripley" 'Finished filling of variable "ripley_date". Value is "[0-9]{8}".' "1h" 

outputContains "ripley" 'Variable "ripley_time" is a ripley internal variable. Trying to fill it.' "1i"
outputContains "ripley" 'Finished filling of variable "ripley_time". Value is "[0-9]{6}".' "1j"
outputContains "ripley" 'Built telegram string: "EMU2PCS RECEIVED12345678abcd[0-9]{14}DONE".' "1k"

# clean up
killRipley
killNcServer
