#!/bin/bash

NODE="./bin/node-linux"
RIPLEY="./ripley.js"

chmod u+x $NODE
$NODE $RIPLEY "$@"

