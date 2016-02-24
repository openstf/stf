# [openstf/stf-armv7l](https://hub.docker.com/r/openstf/stf-armv7l/)

Functionally equivalent to the [openstf/stf](https://hub.docker.com/r/openstf/stf/) Docker image, but runs on `armv7l`.

## Manual build

To build the image, run the following commands from the repo root directory (**not** this directory) on an `armv7l` machine:

```bash
ARCH=armhf docker/armv7l/mkimage-alpine.sh
docker build -f docker/armv7l/Dockerfile -t openstf/stf-armv7l:latest .
```

Note that the build is very, very I/O and CPU-heavy. Don't run it daily on your microSD-backed board or the card will die.

## Nightly build

The following instructions have only been tested on a [Scaleway C1](https://www.scaleway.com/) running Arch Linux with the latest Docker-enabled kernel (currently 4.4.2).

This folder includes [systemd](https://www.freedesktop.org/wiki/Software/systemd/) unit files for an automatic nightly build. The build takes such a long time that there's no point in doing it in real time via hooks.

Once Scaleway tooling becomes a bit easier to approach we might automate the build server provisioning, but honestly it isn't that much work as you'll see.

First, copy the unit files into your build machine's `/etc/systemd/system/` folder. Note that you may have to modify the docker image name inside the unit files if you're planning on pushing the nightly images.

```bash
cp stf-armv7l-* /etc/systemd/system/
```

Alternatively `scp` can be much easier depending on your setup:

```bash
scp stf-armv7l-* root@a.b.c.d:/etc/systemd/system
```

If you're upgrading the units or otherwise tweaking them, don't forget to let systemd know:

```bash
systemctl daemon-reload
```

Let's also make sure that docker and other deps are installed:

```bash
pacman -Sy
pacman -S docker git
```

Some of the unit files require a dedicated build user to exist, so let's create that:

```bash
useradd --system --create-home -G docker stf-armv7l
```

Before enabling docker, you may wish to change the storage driver to `overlay`:

```bash
systemctl edit docker
```

Enter the following contents. Note that I also tend to always lock down docker's `--bip` so that it can't accidentally conflict with any other range (which I've personally experienced in a complex network). Feel free to remove it if you wish.

```systemd
[Service]
ExecStart=
ExecStart=/usr/bin/docker daemon -H fd:// -s overlay --bip 192.168.255.1/24
```

Now, enable and start `docker`:

```bash
systemctl enable docker
systemctl start docker
```

If you want to push the built images, you should login to docker:

```bash
docker login
```

Now all you need to do is enable and start the timer.

```bash
systemctl enable stf-armv7l-publish-latest.timer
systemctl start stf-armv7l-publish-latest.timer
```

You can also publish tags and other branches manually by:

```bash
systemctl start stf-armv7l-publish@v1.1.2
```

Note that the command won't return for a long long time. You can check progress by running `journalctl -f` if necessary.
