#!/bin/bash -
#

PUBLIC_IP=
case $(uname) in
	Darwin)
		PUBLIC_IP=$(ipconfig getifaddr en0)
		;;
	Linux)
		PUBLIC_IP=$(hostname -i)
		;;
esac


node lib/cli.js local --public-ip $PUBLIC_IP \
    --auth-type openid --auth-options '["--identifier=https://login.netease.com/openid/"]' \
    --bind-dev-pub=tcp://$PUBLIC_IP:7114 \
    --bind-dev-pull=tcp://$PUBLIC_IP:7116
exit $?
