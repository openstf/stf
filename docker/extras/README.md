# Docker build extras

Optional utilities for builders.

## docker-cleanup-dangling-images

Daily cleanup of dangling (untagged) images. If you don't clean up old images you may eventually run out of disk space.

First, copy the unit files into your build machine's `/etc/systemd/system/` folder.

```bash
cp docker-cleanup-dangling-images.{service,timer} /etc/systemd/system/
```

Alternatively `scp` can be much easier depending on your setup:

```bash
scp docker-cleanup-dangling-images.{service,timer} root@a.b.c.d:/etc/systemd/system
```

Now all you need to do is enable and start the timer.

```bash
systemctl enable --now docker-cleanup-dangling-images.timer
```

You can also trigger the cleanup job manually:

```bash
systemctl start docker-cleanup-dangling-images
```
