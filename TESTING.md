## Unit Frontend

- `brew install phantomjs`
- `gulp karma`

## E2E Frontend

## On first run
- `gulp webdriver-update`



## Protractor&Jasmine - Local STF tests


---
#### Preconditions
Test configuration point to Google Chrome browser. Test works on Google Chrome v.77.0.3865.75 together with chromedriver with ver. 77.0.3865.40.

---

- Connect a device or start android emulator
- Run RethinkDb
  ```
    rethinkdb
  ```
- Run stf
  ```
    ./bin/stf local
  ```
  Wait till STF will be fully functional and devices will be discovered
- Run tests
  ```
     gulp protractor
  ```

---
#### Info
Test results can be found in:
    test-results/reports-protractor/dashboardReport-protractor/index.html

---

## Multiple Browsers Local STF with a specific suite
- Connect a device
- Run stf
- `gulp protractor --multi --suite devices`

## Chrome Remote STF
- `export STF_URL='http://stf-url/#!/'`
- `export STF_USERNAME='user'`
- `export STF_PASSWORD='pass'`
- `gulp protractor`
