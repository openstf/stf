# 
# Copyright 2020 VMware, Inc
# SPDX-License-Identifier:Apache2.0
# 

# Mac Master Installer inside stf folder
sudo npm install gulp-cli -g
npm install
sudo npm link --unsafe-perm=true --allow-roots
gulp clean
