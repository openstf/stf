#!/bin/bash -
#
node lib/cli.js local --public-ip $(hostname -i) "$@"
exit $?
