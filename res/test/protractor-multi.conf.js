var config = require('./protractor.conf').config
//var LoginPage = require('./e2e/login')
//var HtmlReporter = require('protractor-html-screenshot-reporter')
//var WaitUrl = require('./e2e/helpers/wait-url')

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

//config.onPrepare = function () {
//  var loginPage = new LoginPage()
//  loginPage.doLogin()
//  loginPage.cleanUp()
//
//  this.waitUrl = WaitUrl
//
//  jasmine.getEnv().addReporter(new HtmlReporter({
//    baseDirectory: './res/test/test_out/screenshots'
//  }))
//}


module.exports.config = config
