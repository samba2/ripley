
# Testcase 1, simple active connection, send telegram , receive receipt, send receipt

startNcServer
runRipley test1.yml
# startup incl. sending of first event
outputContains "ripley" 'Configured connection type is "active"' "1a"
outputContains "ripley" 'Connected$' "1b"
outputContains "ripley" 'parsing event "pcs2emuEvent"' "1c"
outputContains "ripley" 'Sending telegram for action "events.pcs2emuEvent.actions.sendPcsTeleg"' "1d"
outputContains "ripley" 'Next action for "events.pcs2emuEvent.actions.sendPcsTeleg" is "events.pcs2emuEvent.actions.recvReceipt". Added to session store' "1e"

# telegram was received on pcs side
outputContains "nc" 'PCS2EMU SNDTEST BUILD   TESTST' "1f"
clearOutput "ripley"
# send wrong input, ripley must log this
sendToRipley "WRONG DATA"
outputContains "ripley" 'Received string: "WRONG DATA"' "1g"
outputContains "ripley" 'Could not find matching action' "1h"
# send correct input
sendToRipley "EMU2PCS RECEIVED"
outputContains "ripley" 'Received string: "EMU2PCS RECEIVED"' "1i"
outputContains "ripley" 'events.pcs2emuEvent.actions.recvReceipt' "1j"
outputContains "ripley" 'telegram response' "1k"
outputContains "ripley" 'Identified action "events.pcs2emuEvent.actions.recvReceipt" .telegram response.' "1l"
# telegram has been sent, waiting for answer
sleep 0.1 
outputContains "nc" 'RECVRESP' "1m"

# test 2, see if answer telegram is correctly removed from session store after sessionTimeout: 2
killRipley
killNcServer
sleep 0.3
clearOutput "ripley"
clearOutput "nc"
startNcServer
runRipley test1.yml
# waiting 3 seconds to timeout session
sleep 2.5
sendToRipley "EMU2PCS RECEIVED"
outputContains "ripley" 'Expiring events.pcs2emuEvent.actions.recvReceipt in session storage' "2a"
outputContains "ripley" 'Could not find matching action' "2b"
outputNotContains "nc" 'RECVRESP' "2c"

# test 3, test 3 telegram send cycles
killRipley
killNcServer
clearOutput "ripley"
clearOutput "nc"
startNcServer
runRipley test1.yml
# send startup telegram
outputContains "ripley" 'Sending telegram for action "events.pcs2emuEvent.actions.sendPcsTeleg"' "3a"
outputContains "ripley" 'Cycle time is 3 seconds' "3b"

# telegram was received
outputContains "nc" 'PCS2EMU SNDTEST BUILD   TESTST' "3c"
# send answer to ripley
sendToRipley "EMU2PCS RECEIVED"

# ripley did receive telegram, ripley sends 3. telegram to pcs
outputContains "ripley" 'telegram response' "3d"
outputContains "ripley" 'Identified action "events.pcs2emuEvent.actions.recvReceipt" .telegram response.' "3e"

# 3. telegram was received
outputContains "nc" 'RECVRESP' "3f"
clearOutput "ripley"
clearOutput "nc"

# wait for 1. cycle to start
sleep 3.2

# 1 TEST CYCLE
# automatic resend is triggered
outputContains "ripley" 'Cycle time is over.' "3g"
outputContains "ripley" 'Trying to send teleg for action events.pcs2emuEvent.actions.sendPcsTeleg' "3h"
outputContains "ripley" 'Sending telegram for action "events.pcs2emuEvent.actions.sendPcsTeleg"' "3i"
outputContains "ripley" 'Next action for "events.pcs2emuEvent.actions.sendPcsTeleg" is "events.pcs2emuEvent.actions.recvReceipt". Added to session store' "3j"
outputContains "nc" 'PCS2EMU SNDTEST BUILD   TESTST' "3k"
sendToRipley "EMU2PCS RECEIVED"
# ripley did receive telegram, ripley sends 3. telegram to pcs
outputContains "ripley" 'telegram response' "3l"
outputContains "ripley" 'Identified action "events.pcs2emuEvent.actions.recvReceipt" .telegram response.' "3l"
# 3. telegram was received
outputContains "nc" 'RECVRESP' "3n"

# wait for 1. cycle to start
sleep 3.2

# 2 TEST CYCLE
# automatic resend is triggered
outputContains "ripley" 'Cycle time is over.' "3o"
outputContains "ripley" 'Trying to send teleg for action events.pcs2emuEvent.actions.sendPcsTeleg' "3p"
outputContains "ripley" 'Sending telegram for action "events.pcs2emuEvent.actions.sendPcsTeleg"' "3q"
outputContains "ripley" 'Next action for "events.pcs2emuEvent.actions.sendPcsTeleg" is "events.pcs2emuEvent.actions.recvReceipt". Added to session store' "3r"
outputContains "nc" 'PCS2EMU SNDTEST BUILD   TESTST' "3s"
sendToRipley "EMU2PCS RECEIVED"
# ripley did receive telegram, ripley sends 3. telegram to pcs
outputContains "ripley" 'telegram response' "3t"
outputContains "ripley" 'Identified action "events.pcs2emuEvent.actions.recvReceipt" .telegram response.' "3u"
# 3. telegram was received
outputContains "nc" 'RECVRESP' "3v"


# clean up
killRipley
killNcServer
