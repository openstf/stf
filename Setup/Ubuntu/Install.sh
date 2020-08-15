# 
# Copyright 2020 VMware, Inc
# SPDX-License-Identifier:Apache2.0
# 

# Ubuntu Installer

# Basic Req
sudo apt-get install -y python-software-properties
sudo add-apt-repository ppa:webupd8team/java
sudo apt-get update
sudo apt-get install -y oracle-java7-installer
sudo apt-get install -y lib32stdc++6

#adb
sudo add-apt-repository universe
sudo apt-get update
sudo apt-get install android-tools-adb

#Set Vars
export ANDROID_SDK="$HOME/android-sdk-linux"
PATH=$PATH:$ANDROID_SDK/platform-tools:$ANDROID_SDK/tools


##PREREQ
#Node.js >= 0.12
sudo apt-get install -y node.js


#RethinkDB >= 2.2
source /etc/lsb-release && echo "deb http://download.rethinkdb.com/apt $DISTRIB_CODENAME main" | sudo tee /etc/apt/sources.list.d/rethinkdb.list
wget -qO- https://download.rethinkdb.com/apt/pubkey.gpg | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y rethinkdb

#GraphicsMagick
sudo apt-get install -y graphicsmagick

#ZeroMQ [all versions taken care]
sudo apt-get install -y libzmq1
sudo apt-get install -y libzmq-dev
sudo apt-get install -y libzmq3-dev

#Protocol Buffers
sudo apt-get install -y libprotobuf*
sudo apt-get install -y protobuf-compiler

#yasm
sudo apt-get install -y yasm
sudo apt-get install -y npm
sudo apt-get install -y nodejs-legacy
npm install -y --save jpeg-turbo

#pkg-config
sudo apt-get install -y pkg-config

#adb
sudo apt install -y adb

##STF
sudo apt-get install -y git
sudo npm install -g stf

# Check
stf doctor