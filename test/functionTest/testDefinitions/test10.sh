startNcServer

# test wrong connection type
runRipley test10a.yml
# startup incl. sending of first event
outputContains "ripley" '"connectionType" is set to "activee". Allowed values are "passive" or "active"' "1a"

# invalid ip address
runRipley test10b.yml
outputContains "ripley" '"destinationHost" is set to "1278.0.0.1". Please provide a valid IP-address or a valid hostname' "1b"

# invalid hostname
runRipley test10c.yml
outputContains "ripley" '"destinationHost" is set to "invalid.hostname.". Please provide a valid IP-address or a valid hostname' "1c"

# port is no integer
runRipley test10d.yml
outputContains "ripley" 'The data type of parameter "port" is wrong. The configured value "abc" has a data type of "string". The allowed data types are: "number".' "1d"

# cycle time is out of range
runRipley test10e.yml
outputContains "ripley" 'Parameter "cycleTime" is set to 3601. The permited range is between 2 and 3600.' "1e"

# invalid buffer key
runRipley test10f.yml
outputContains "ripley" 'Allowed is a variable of an existing telegram following that syntax: \${variablename}' "1f"

# onlySendOnGuiTrigger: true requires direction "send"
runRipley test10g.yml
outputContains "ripley" 'Parameter "events.firstEvent.onlySendOnGuiTrigger" with value "true" requires the parameter "events.firstEvent.direction" with value "send".' "1g"

# stopSendingOnStatusMaxAmount requires status
runRipley test10h.yml
outputContains "ripley" 'Parameter "events.firstEvent.stopSendingOnStatusMaxAmount" requires the parameter "events.firstEvent.status".' "1h"

# no same value for previousStatus and status
runRipley test10i.yml
outputContains "ripley" 'Parameter "events.firstEvent.previousStatus" and "events.firstEvent.status" are not allowed to have the same value.' "1i"

# check for unique values throughout the whole config for "status" and "previousStatus"
runRipley test10j.yml
outputContains "ripley" 'The parameter "previousStatus" with a value of "myStatuss" has to be unique in the whole configuration. Currently it is configured at "events.firstEvent.previousStatus" and "events.secondEvent.previousStatus".' "1j"

# telegram is not defined for an action
runRipley test10k.yml
outputContains "ripley" 'The parameter "events.thirdEvent.actions.firstAction.telegram" does not exist.' "1k"

# no global buffer var
runRipley test10l.yml
outputContains "ripley" 'The telegram "events.secondEvent.actions.sendPcsTelegSecondEvent.telegram" contains buffer variables. However, the global "bufferKey" parameter is not defined.' "1l"

# global buffer var does not match a telegrams buffer var
runRipley test10m.yml
outputContains "ripley" 'The global buffer key "\$\{buffer_otherKey\}" can not be found in the buffer variables of telegram "events.secondEvent.actions.sendPcsTelegSecondEvent.telegram".' "1m"

# no buffer key source located (either previously received teleg or derived by previousStatus )
runRipley test10n.yml
outputContains "ripley" 'Telegram "events.secondEvent.actions.sndReceiptSecondEvent.telegram" contains buffer variables. However, buffer data can not be reached' "1n"

# inconsistent variable length definition
runRipley test10o.yml
outputContains "ripley" 'Telegram "events.secondEvent.actions.rcvPcsTelegSecondEvent.telegram" has variable "\${buffer_myKey}" defined with a length of 8. However, telegram "events.firstEvent.actions.sendPcsTelegFirstEvent.telegram" defines the same variable with a length of 7.' "1o"

# inconsistent ripley internal variable length definition
runRipley test10p.yml
outputContains "ripley" 'The Ripley internal variable "\$\{ripley_time\}" of telegram "events.emu2pcsEvent.actions.sendReceipt.telegram" has a configured length of 7. The actual content is "[[:digit:]]{6}+" with a length of 6. Please adjust this' "1p"

# clean up
killNcServer
killRipley
