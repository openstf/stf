# STF

### Requirements

- NodeJS
- Bower
- RethinkDB

### Install

- `brew install rethinkdb`
- Make internal npm work
- `brew install protobuf`
- `brew install zmq`
- `npm install -g bower`
- `npm install`
- `bower install`
- `npm link`

### Run

- `rethinkdb`
- `stf local`

### Update

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
