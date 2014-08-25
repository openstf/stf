// Reference: https://github.com/angular/protractor/blob/master/referenceConf.js
var LoginPage = require('./e2e/app-login.js')

exports.config = {
  chromeOnly: true,
  baseUrl: 'http://localhost:7100/#!/',
  specs: ['res/test/e2e/**/*-spec.js'],
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  },
  capabilities: {
    browserName: 'chrome'
  },
  onPrepare: function() {
    var loginPage = new LoginPage()
    loginPage.login()
    //browser.driver.wait(loginPage.login)
  }
}
