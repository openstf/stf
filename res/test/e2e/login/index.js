var loginBaseUrl = 'http://localhost:7120'

module.exports = function LoginPage() {
  this.get = function () {
    return browser.get(loginBaseUrl)
  }
  this.name = element(by.model('name'))
  this.email = element(by.model('email'))
  this.setName = function (name) {
    return this.name.sendKeys(name)
  }
  this.setEmail = function (email) {
    return this.email.sendKeys(email)
  }
  this.setPassword = function (password) {
    return this.password.sendKeys(password)
  }
  this.submit = function () {
    return this.name.submit()
  }
  this.login = function () {
    this.get()
    this.setName('test_user')
    this.setEmail('test_user@login.local')
    return this.submit()
  }
}
