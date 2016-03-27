describe('Login Page', function() {
  var LoginPage = require('./')
  var loginPage = new LoginPage()

  it('should have an url to login', function() {
    expect(loginPage.login.url).toMatch('http')
  })

  it('should login with method: "' + loginPage.login.method + '"', function() {
    loginPage.doLogin().then(function() {
      browser.getLocationAbsUrl().then(function(newUrl) {
        expect(newUrl).toBe(protractor.getInstance().baseUrl + 'devices')
      })
    })
  })
})
