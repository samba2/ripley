startNcServer
runRipley test3b_use_received_vars_in_answer.yml

# startup messages
outputContains "ripley" 'Trying to connect to 127.0.0.1:12001' "1a"
outputContains "ripley" 'Connected$' "1b"
outputContains "ripley" 'parsing event "emu2pcsEvent"' "1c"
# the only event defined is a receive event
outputContains "ripley" 'event "emu2pcsEvent" is a "receive" event. Doing nothing' "1d"

sendToRipley "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"
outputContains "nc" 'EMU2PCS RECEIVED12345678abcdefgh' "1e"
outputContains "ripley" 'Received string: "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"' "1f"

outputContains "ripley" 'No buffer variables found. No change to buffer' "1g"
outputContains "ripley" 'Variable "weight" is a direct answer variable. Trying to fill it.' "1h"
outputContains "ripley" 'Finished filling of variable "weight". Value is "abcd".' "1i"

clearOutput "ripley"
clearOutput "nc"
sleep 0.5

# testing second event, mix between buffer and direct answer vars
sendToRipley "PCS2EMU 12345678MIXTEST 33kg12kmhijk40qmID000012VER1DONE"
outputContains "nc" 'EMU2PCS RECEIVED1234567833kg12kmID000012    VER1DONE' "2a"

outputContains "ripley" 'Detected direct answer variable "sessionId" with value "ID000012". Storing in memory.' "2b"
outputContains "ripley" 'Detected direct answer variable "telegVersion" with value "VER1". Storing in memory.' "2c"
outputContains "ripley" 'Identified action "events.mixedEmu2pcsEvent.actions.receiveTeleg" \(first time receive\)' "2d"
outputContains "ripley" 'Finished filling of variable "buffer_testKey". Value is "12345678"' "2e"
outputContains "ripley" 'Finished filling of variable "buffer_size". Value is "12km"' "2f"
outputContains "ripley" 'Finished filling of variable "sessionId". Value is "ID000012"' "2g"
outputContains "ripley" 'Finished filling of variable "telegVersion". Value is "VER1".' "2h"

# clean up
killRipley
killNcServer
