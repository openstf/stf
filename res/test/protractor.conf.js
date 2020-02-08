// Reference: https://github.com/angular/protractor/blob/master/referenceConf.js
var LoginPage = require('./e2e/login')
var BrowserLogs = require('./e2e/helpers/browser-logs')
//var FailFast = require('./e2e/helpers/fail-fast')
var jasmineReporters = require('jasmine-reporters')
var WaitUrl = require('./e2e/helpers/wait-url')
var HTMLReport = require('protractor-html-reporter-2')

var reportsDirectory = './test-results/reports-protractor'
var dashboardReportDirectory = reportsDirectory + '/dashboardReport'

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
      'http://localhost:7100',
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
      args: ['--test-type --no-sandbox'] // Prevent security warning bug in ChromeDriver
    }
  },
  chromeOnly: true,
  onPrepare: function() {
    var loginPage = new LoginPage()
    loginPage.doLogin()
    loginPage.cleanUp()

    this.waitUrl = WaitUrl

    jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
      consolidateAll: true,
      savePath: reportsDirectory + '/xml',
      filePrefix: 'xmlOutput'
    }))

    var fs = require('fs-extra')
    if (!fs.existsSync(dashboardReportDirectory)) {
      fs.mkdirs(dashboardReportDirectory)
    }

    jasmine.getEnv().addReporter({
      specDone: function(result) {
          if (result.status === 'failed') {
              browser.getCapabilities().then(function(caps) {
                  var browserName = caps.get('browserName')

                  browser.takeScreenshot().then(function(png) {
                      var stream = fs.createWriteStream(dashboardReportDirectory + '/' +
                        browserName + '-' + result.fullName + '.png')
                      stream.write(new Buffer(png, 'base64'))
                      stream.end()
                  })
              })
          }
      }
    })

    afterEach(function() {
      BrowserLogs({expectNoLogs: true})
      //FailFast()
    })
  },
  onComplete: function() {
    var browserName, browserVersion, platform, testConfig
    var capsPromise = browser.getCapabilities()

    capsPromise.then(function(caps) {
    browserName = caps.get('browserName')
    browserVersion = caps.get('version')
    platform = caps.get('platform')

    testConfig = {
      reportTitle: 'Protractor Test Execution Report',
      outputPath: dashboardReportDirectory,
      outputFilename: 'index',
      screenshotPath: '.',
      testBrowser: browserName,
      browserVersion: browserVersion,
      modifiedSuiteName: false,
      screenshotsOnlyOnFailure: true,
      testPlatform: platform
    }
    new HTMLReport().from(reportsDirectory + '/xml/xmlOutput.xml', testConfig)
    })
  }
}
