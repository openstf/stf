// Reference: https://github.com/angular/protractor/blob/master/referenceConf.js
var LoginPage = require('./e2e/login')
var BrowserLogs = require('./e2e/helpers/browser-logs')
//var FailFast = require('./e2e/helpers/fail-fast')
var HtmlReporter = require('protractor-html-screenshot-reporter')
var WaitUrl = require('./e2e/helpers/wait-url')

module.exports.config = {
  baseUrl: process.env.STF_URL || 'http://localhost:7100/#!/',
  suites: {
    control: 'e2e/control/**/*-spec.js',
    devices: 'e2e/devices/**/*-spec.js',
    help: 'e2e/help/**/*-spec.js',
    login: 'e2e/login/**/*-spec.js',
    settings: 'e2e/settings/**/*-spec.js'
  },
  params: {
    login: {
      url: process.env.STF_LOGINURL || process.env.STF_URL ||
      'http://localhost:7120',
      username: process.env.STF_USERNAME || 'test_user',
      email: process.env.STF_EMAIL || 'test_user@login.local',
      password: process.env.STF_PASSWORD,
      method: process.env.STF_METHOD || process.env.STF_PASSWORD ? 'ldap' :
        'mock'
    }
  },
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    isVerbose: true,
    includeStackTrace: true
  },
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ['--test-type'] // Prevent security warning bug in ChromeDriver
    }
  },
  chromeOnly: true,
  onPrepare: function() {
    var loginPage = new LoginPage()
    loginPage.doLogin()
    loginPage.cleanUp()

    this.waitUrl = WaitUrl

    jasmine.getEnv().addReporter(new HtmlReporter({
      baseDirectory: './res/test/test_out/screenshots'
    }))

    afterEach(function() {
      BrowserLogs({expectNoLogs: true})
      //FailFast()
    })
  },
  onComplete: function() {

  }
}
