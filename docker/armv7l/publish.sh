#!/usr/bin/env sh
set -xeuo pipefail
ARCH=armhf docker/armv7l/mkimage-alpine.sh
docker build -f docker/armv7l/Dockerfile -t openstf/stf-armv7l:latest
docker push openstf/stf-armv7l:latest
