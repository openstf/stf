#!/usr/bin/env bash
set -euo pipefail
wget http://archlinuxarm.org/os/ArchLinuxARM-odroid-xu3-latest.tar.gz | gunzip | docker import - archlinuxarm/odroid-xu3:latest
