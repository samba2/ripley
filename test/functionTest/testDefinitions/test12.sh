# Testcase 12, read external data via script call

startNcServer
runRipley test12a_buffer_var_as_script_argument.yml

outputContains "ripley" 'Connected$' "1a"
sendToRipley "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"
outputContains "ripley" 'Received string: "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"' "1b"

outputContains "ripley" 'Action has run section configured. Trying to execute configured programs.' "1c"
outputContains "ripley" 'Variable "\${buffer_testKey}" is a buffer variable. Trying to find value in buffer.' "1d"
outputContains "ripley" 'Data source "valueEcho" was executed with command line' "1e"
outputContains "ripley" 'Storing external data received from data source "valueEcho". Key: "weight", value: "12345678"' "1f"
outputContains "ripley" 'Variable "external_valueEcho_weight" is a external variable. Trying to fill it.' "1g"
outputContains "ripley" 'Found external data for variable "weight", value is "12345678"' "1h"
outputContains "ripley" 'Finished filling of variable "external_valueEcho_weight". Value is "12345678"' "1i"
outputContains "ripley" 'Built telegram string: "EMU2PCS 12345678"' "1j"
outputContains "ripley" 'Finished sending telegram' "1k"

clearOutput "ripley"
clearOutput "nc"

killRipley
killNcServer

# 2. test - arguments of external program can contain buffer and direct answer vars
startNcServer
runRipley test12b_buffer_and_directAnswer_var_as_script_argument.yml

outputContains "ripley" 'Connected$' "2a"
sendToRipley "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"
outputContains "ripley" 'Received string: "PCS2EMU 12345678RCVTEST abcdefghijklmnopqrstovwxyz"' "2b"

outputContains "ripley" 'Variable "\${buffer_testKey}" is a buffer variable. Trying to find value in buffer.' "2c"
outputContains "ripley" 'Variable "\${length}" is a direct answer variable. Trying to find the value in the telegram previously received.' "2d"
outputContains "ripley" 'Argument "length:\${length}" has been changed to "length:mnop"' "2e"
outputContains "ripley" 'Buffer key "12345678" contains no key "buffer_nonExisting". Appending empty string.' "2f"
outputContains "ripley" 'Data source "valueEcho" was executed with command line "/home/xubuntu/ripley/trunk/externalPrograms/valueEcho.sh "weight:12345678" "length:mnop" """. Processing output.' "2g"
outputContains "ripley" 'Storing external data received from data source "valueEcho". Key: "weight", value: "12345678".' "2h"
outputContains "ripley" 'Storing external data received from data source "valueEcho". Key: "length", value: "mnop".' "2i"
outputContains "ripley" 'Variable "external_valueEcho_weight" is a external variable. Trying to fill it.' "2j"
outputContains "ripley" 'Found external data for variable "weight", value is "12345678"' "2k"
outputContains "ripley" 'Finished filling of variable "external_valueEcho_weight". Value is "12345678".' "2l"
outputContains "ripley" 'Built telegram string: "EMU2PCS 12345678".' "2m"



# clean up
killRipley
killNcServer
