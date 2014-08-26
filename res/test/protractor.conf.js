// Reference: https://github.com/angular/protractor/blob/master/referenceConf.js
var LoginPage = require('./e2e/login')

exports.config = {
  baseUrl: 'http://localhost:7100/#!/',
  suites: {
    control: 'e2e/control/**/*-spec.js',
    devices: 'e2e/devices/**/*-spec.js',
    help: 'e2e/help/**/*-spec.js',
    login: 'e2e/login/**/*-spec.js',
    settings: 'e2e/settings/**/*-spec.js'
  },
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  },
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ['--test-type'] // Prevent security warning bug in ChromeDriver
    }
  },
  chromeOnly: true,
  onPrepare: function () {
    var loginPage = new LoginPage()
    loginPage.login()
    //browser.driver.wait(loginPage.login)
  }
}
