
startNcServer
runRipley test2.yml

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

clearOutput "ripley"
clearOutput "nc"
# sending the correct data
sendToRipley "PCS2EMU RCVTEST "
# telegram is recognized
outputContains "ripley" 'Received string: "PCS2EMU RCVTEST "' "1g"
outputContains "ripley" 'Identified action "events.emu2pcsEvent.actions.receiveTeleg" \(first time receive\)' "1h"
outputContains "ripley" 'Sending telegram for action "events.emu2pcsEvent.actions.sendReceipt"' "1i"
outputContains "ripley" 'Next action for "events.emu2pcsEvent.actions.sendReceipt" is "events.emu2pcsEvent.actions.receiveReceipt". Added to session store.' "1j"
# emu did send answer teleg
outputContains "nc" 'EMU2PCS RECEIVED' "1k"

clearOutput "ripley"
clearOutput "nc"
# send last teleg of event to emu
sendToRipley "RECVIO"
# emu did recognize teleg
outputContains "ripley" 'Identified action "events.emu2pcsEvent.actions.receiveReceipt" .telegram response.' "1l"
outputContains "ripley" 'No answer defined after action "events.emu2pcsEvent.actions.receiveReceipt". Doing nothing.' "1m"

sleep 0.5
clearOutput "ripley"
clearOutput "nc"
# sending the correct data
sendToRipley "PCS2EMU RCVTEST "
outputContains "ripley" 'Sending telegram for action "events.emu2pcsEvent.actions.sendReceipt"' "1n"
# emu did send answer teleg
outputContains "nc" 'EMU2PCS RECEIVED' "1o"
# force time out of telegram
sleep 2.5
sendToRipley "RECVIO"
outputContains "ripley" 'Received string: "RECVIO"' "1p"
outputContains "ripley" 'Expiring events.emu2pcsEvent.actions.receiveReceipt in session storage' "1q"
outputContains "ripley" 'Could not find matching action.' "1r"

# clean up
killRipley
killNcServer
