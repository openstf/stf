# [openstf/stf-armv7l](https://hub.docker.com/r/openstf/stf-armv7l/)

An alternate docker image for `armv7l`.

To build the image, run the following commands from the repo root directory (**not** this directory) on an `armv7l` machine:

```bash
ARCH=armhf docker/armv7l/mkimage-alpine.sh
docker build -f docker/armv7l/Dockerfile -t openstf/stf-armv7l:latest
```
