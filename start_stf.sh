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

AUTH="--auth-type openid"

node lib/cli.js local --public-ip $PUBLIC_IP $AUTH "$@"
exit $?
