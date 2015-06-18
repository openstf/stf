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
