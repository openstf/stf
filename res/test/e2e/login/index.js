module.exports = function LoginPage() {
  this.login = protractor.getInstance().params.login

  this.get = function () {
    return browser.get(this.login.url)
  }
  this.username = element(by.model('username'))

  if (this.login.method === 'ldap') {
    this.password = element(by.model('password'))
  } else {
    this.email = element(by.model('email'))
  }

  this.setName = function (username) {
    return this.username.sendKeys(username)
  }
  this.setEmail = function (email) {
    return this.email.sendKeys(email)
  }
  this.setPassword = function (password) {
    return this.password.sendKeys(password)
  }
  this.submit = function () {
    return this.username.submit()
  }
  this.doLogin = function () {
    this.get()
    this.setName(this.login.username)
    if (this.login.method === 'ldap') {
      this.setPassword(this.login.password)
    } else {
      this.setEmail(this.login.email)
    }
    return this.submit()
  }
}
