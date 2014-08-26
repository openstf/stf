var config = require('./protractor.conf').config
var HtmlReporter = require('protractor-html-screenshot-reporter')

config.chromeOnly = false
config.capabilities = null
config.multiCapabilities = [
  {
    browserName: 'chrome',
    chromeOptions: {
      args: ['--test-type'] // Prevent security warning bug in ChromeDriver
    }
  },
  {
    browserName: 'firefox'
  }
  //{
  //  browserName: 'safari'
  //}
  // add appium/sauce labs
]

config.onPrepare = function () {
  var loginPage = new LoginPage()
  loginPage.doLogin()
  loginPage.cleanUp()

  jasmine.getEnv().addReporter(new HtmlReporter({
    baseDirectory: './res/test/test_out/screenshots'
  }))
}


exports.config = config
