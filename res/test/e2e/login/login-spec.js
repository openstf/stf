describe('Login Page', function() {
  var LoginPage = require('./')
  var loginPage = new LoginPage()

  beforeEach(function() {
    browser.executeScript('window.localStorage.clear();')
    browser.executeScript('window.sessionStorage.clear();')
    browser.driver.manage().deleteAllCookies()
  })

  it('should have an url to login', function() {
    expect(loginPage.login.url).toMatch('http')
  })

  it('should login with method: "' + loginPage.login.method + '"', function() {
    loginPage.doLogin().then(function() {
      browser.getCurrentUrl().then(function(newUrl) {
        expect(newUrl).toBe(browser.baseUrl + 'devices')
      })
    })
  })
})
