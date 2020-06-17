# 
# Copyright 2020 VMware, Inc
# SPDX-License-Identifier:Apache2.0
# 

# ./Setup/Mac/Install.sh
# Mac Installer

# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

# adb tools
brew cask install android-platform-tools

# node & npm
curl https://nodejs.org/dist/latest-v8.x/node-v8.17.0.pkg --output node-v8.17.0.pkg
sudo installer -store -pkg "node-v8.17.0.pkg" -target /
node -v

# git
brew install git

# rethinkdb graphicsmagick zeromq protobuf yasm pkg-config
brew install rethinkdb graphicsmagick zeromq protobuf yasm pkg-config

# stf node module
sudo npm install -g stf --unsafe-perm=true --allow-roots

# health of requirements
stf doctor