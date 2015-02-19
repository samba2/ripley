startNcServer
runRipley test3a_buffer_receive_and_send.yml

# startup messages
outputContains "ripley" 'Trying to connect to 127.0.0.1:12001' "1a"
outputContains "ripley" 'Connected$' "1b"
outputContains "ripley" 'parsing event "emu2pcsEvent"' "1c"
# the only event defined is a receive event
outputContains "ripley" 'event "emu2pcsEvent" is a "receive" event. Doing nothing' "1d"
# sending wrong data
sendToRipley "WRONG DATA Again"
outputContains "ripley" 'Received string: "WRONG DATA Again"' "1e"
outputContains "ripley" 'Could not find matching action' "1f"

#sending third telegram of session, receiveReceipt. since telegram sendReceipt has not been sent,
#receiveReceipt is not allowed now
clearOutput "ripley"
clearOutput "nc"
sleep 0.5

sendToRipley "RECVIO133g243m12345678DONE"
sleep 0.1
outputContains "ripley" 'Received string: "RECVIO133g243m12345678DONE"' "2a"
outputContains "ripley" 'Could not find matching action' "3b"

# now starting valid receive event, sending telegram for action receiveTeleg
sendToRipley "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"
sleep 0.1
outputContains "nc" 'EMU2PCS RECEIVED12345678abcdefgh' "4a"

# ripley is storing received data
outputContains "ripley" 'Found buffer variables in telegram definition. Writing values to buffer.' "4b"
outputContains "ripley" 'Writing to buffer: key: "12345678", name: "testKey", value: "12345678"' "4c"
outputContains "ripley" 'Writing to buffer: key: "12345678", name: "weight", value: "abcd"' "4d"
outputContains "ripley" 'Writing to buffer: key: "12345678", name: "size", value: "efgh"' "4e"
outputContains "ripley" 'Writing to buffer: key: "12345678", name: "length", value: "mnop"' "4f"

# some examples of the buffer content
outputContains "ripley" 'name: "weight", value: "abcd"' "4g"
outputContains "ripley" 'name: "length", value: "mnop"' "4h"
outputContains "ripley" 'name: "status", value: "A1"' "4i"
outputContains "ripley" 'name: "status timestamp", value:' "4j"

clearOutput "ripley"
clearOutput "nc"
sleep 0.5

# update buffer
sendToRipley "PCS2EMU 12345678RCVTEST NEWWefghijklmnopqrstovwxyz"
outputContains "nc" 'EMU2PCS RECEIVED' "5a"

# new val
outputContains "ripley" 'name: "weight", value: "NEWW"' "5b"
# old val is the same
outputContains "ripley" 'name: "length", value: "mnop"' "5c"

clearOutput "ripley"
clearOutput "nc"
sleep 0.5

# second key telegram
sendToRipley "PCS2EMU 87654321RCVTEST QWERTZUIOPASDFGHJKLYXCVBNM"
outputContains "nc" 'EMU2PCS RECEIVED' "6a"
# value of old test key
outputContains "ripley" 'name: "weight", value: "NEWW"' "6b"
# new test key
outputContains "ripley" 'name: "weight", value: "QWER"' "6c"

clearOutput "ripley"
clearOutput "nc"
sleep 0.5

# send third teleg. of emu2pcsEvent
sendToRipley "RECVIO133g243m12345678DONE"
outputContains "ripley" 'Received string: "RECVIO133g243m12345678DONE"' "7a"
# updating buffer for defined variables
outputContains "ripley" 'Writing to buffer: key: "12345678", name: "weight", value: "133g"' "7c"
outputContains "ripley" 'Writing to buffer: key: "12345678", name: "size", value: "243m"' "7d"
outputContains "ripley" 'name: "status", value: "A1"' "7e"
outputContains "ripley" 'For buffer entry "12345678" the status is already set to "A1". Do not update status.' "7f"
outputContains "ripley" 'No answer defined after action "events.emu2pcsEvent.actions.receiveReceipt". Doing nothing.' "7g"

# clean up
killRipley
killNcServer
