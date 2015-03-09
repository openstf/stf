# STF
===
STF (Smartphone Test Farm) is a service for remotely debugging real smartphone devices from the comfort of your browser.

Features
===
- Support Android devices from 2.3 to 5.0
- Fast device screen transfer
- Remote mouse and keyboard input
- Multitouch support
- Browse to URL
- Auto-detect installed browsers
- Realtime logging and filtering
- Copy and Paste text
- APK Upload by drag & drop
- Screen rotation
- Search devices on your own devices farm
- See who is using which device
- Execute shell commands directly
- Remote debug for native and web apps
- Chrome remote debug tools
- Automated Play Store user input
- Reverse port forwarding for development
- Device hardware specific information


Getting started
===

- `brew install rethinkdb`
- Make internal npm work
- `brew install protobuf`
- `brew install zmq`
- `npm install -g bower`
- `npm install`
- `bower install`
- `npm link`

Requirements
===

- NodeJS
- Bower
- RethinkDB

Run
===

- `rethinkdb`
- `stf local`

Update
===

- `git pull`
- `npm install`
- `bower install`


### Tests

## Unit Frontend

- `brew install phantomjs`
- `gulp karma`

## E2E Frontend

### On first run
- `gulp webdriver-update`

### Chrome Local STF
- Connect a device
- Run stf
- `gulp protractor`

### Multiple Browsers Local STF with a specific suite
- Connect a device
- Run stf
- `gulp protractor --multi --suite devices`

### Chrome Remote STF
- `export STF_URL='http://stf-url/#!/'`
- `export STF_USERNAME='user'`
- `export STF_PASSWORD='pass'`
- `gulp protractor`



Contributing
===



License
===

## Main repository
- Free Software Foundation’s [GNU AGPL v3.0](http://www.fsf.org/licensing/licenses/agpl-3.0.html).
- Commercial licenses are also available from [CyberAgent, Inc.](mailto:stf@cyberagent.co.jp), including free licenses.

## Small repositories
- [Apache License v2.0.](http://www.apache.org/licenses/LICENSE-2.0)

## Documentation
- Documentation: [Creative Commons](http://creativecommons.org/licenses/by-nc-sa/3.0/).


Copyright © CyberAgent, Inc. All Rights Reserved.



