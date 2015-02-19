#!/bin/bash

TESTDIR="./ripleyTestCases"
RIPLEY="../../ripley.js"
NODE="../../bin/node-linux"
NC="/bin/nc"
NC_OUT="/tmp/ripley_test_nc.out"
RIPLEY_OUT="/tmp/ripley_test_ripley.out"
NC_FIFO="/tmp/ripley_test_fifo"
PCS_PORT=12001   # port where the netcat-pcs emulation waits for ripley connects
NC_PID=
RIPLEY_PID=
CAT_PID=

. ./lib/testFunctions.sh # read test functions

################### Test Start #########################
# run test case 1, ripley connects to pcs, basic "send" action (sending telegr, receiving receipt...), session timeout, 
# repeat sending telegrams after cycle time is over
echo "------------- Testcase 1 ---------------------"
. ./testDefinitions/test1.sh

# test case 2, one "receive" event, receive telg, session store, time out old teleg
echo "------------- Testcase 2 ---------------------"
. ./testDefinitions/test2.sh

# test case 3a, one "receive" event, receive telg, storing variables in buffer + status.
# answering telegram with buffer variables, overwriting buffer values with newly received data
echo "------------- Testcase 3a ---------------------"
. ./testDefinitions/test3a_buffer_receive_and_send.sh

# test case 3b, testing direct answer variables + mix of buffer vars and direct answer vars
echo "------------- Testcase 3b ---------------------"
. ./testDefinitions/test3b_use_received_vars_in_answer.sh

# test case 3c, testing ripley internal vars
echo "------------- Testcase 3c ---------------------"
. ./testDefinitions/test3c_ripley_internal_vars.sh


#  test case 4, fill buffer, new event var stopSendingOnStatusMaxAmount, stop sending requests after 
#  buffer of status A1 has 3 entries
echo "------------- Testcase 4 ---------------------"
. ./testDefinitions/test4.sh

#  test case 5, get buffer value from previous status + auto-update status to status of
#  current event sending telegram
echo "------------- Testcase 5 ---------------------"
. ./testDefinitions/test5.sh

#  test case 6, individual cycle times (per event)
echo "------------- Testcase 6 ---------------------"
. ./testDefinitions/test6.sh

#  test case 7, deleting buffer (special removeBufferEntriesOfStatus event)
echo "------------- Testcase 7 ---------------------"
. ./testDefinitions/test7.sh

#~ #  test case 8, limit buffer fill size of a certain status (event maxEntriesOfStatusInBuffer)
echo "------------- Testcase 8 ---------------------"
. ./testDefinitions/test8.sh
#
#
#  test case 10, syntax checks
echo "------------- Testcase 10 ---------------------"
. ./testDefinitions/test10.sh
#
# test case 11, testing ripley random var
echo "------------- Testcase 11 ---------------------"
. ./testDefinitions/test11_ripley_random_var.sh
#
# test case 12a, read external data via script call
echo "------------- Testcase 12 ---------------------"
. ./testDefinitions/test12.sh


