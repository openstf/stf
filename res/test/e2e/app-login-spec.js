describe('Login Page', function () {
  var LoginPage = require('./app-login')
  var loginPage = new LoginPage()

  it('should login with auth-mock', function () {
    loginPage.get()

    loginPage.setName('test_user')
    loginPage.setEmail('test_user@test.local')

    loginPage.submit().then(function () {
      browser.getLocationAbsUrl().then(function (newUrl) {
        expect(newUrl).toBe(protractor.getInstance().baseUrl + 'devices')
      })
    })
  })
})
