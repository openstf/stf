# 
# Copyright 2020 VMware, Inc
# SPDX-License-Identifier:Apache2.0
# 

# Mac Run Master Server
stf local --bind-dev-pub tcp://$1:7114 --bind-dev-pull tcp://$1:7116 --public-ip $1 --allow-remote