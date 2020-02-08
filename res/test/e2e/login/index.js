module.exports = function LoginPage() {
  this.login = browser.params.login

  this.get = function() {
    return browser.get(this.login.url)
  }

  this.username = element(by.model('username'))

  if (this.login.method === 'ldap') {
    this.password = element(by.model('password'))
  } else {
    this.email = element(by.model('email'))
  }


  this.setName = function(username) {
    return this.username.sendKeys(username)
  }

  this.setEmail = function(email) {
    return this.email.sendKeys(email)
  }

  this.setPassword = function(password) {
    return this.password.sendKeys(password)
  }

  this.submit = function() {
    return this.username.submit()
  }

  this.getUserName = function() {
    return this.login.username
  }

  this.doLogin = function(userName, email, password) {
    var EC = protractor.ExpectedConditions
    var timeout = 15000
    var loginName = (typeof userName !== 'undefined') ? userName : this.login.username
    var loginEmail = (typeof email !== 'undefined') ? email : this.login.email
    var loginPassword = (typeof password !== 'undefined') ? email : this.login.password

    this.get()
    browser.wait(EC.presenceOf(element(by.css('[value="Log In"]'))), timeout)
    this.setName(loginName)
    if (this.login.method === 'ldap') {
      this.setPassword(loginPassword)
    } else {
      this.setEmail(loginEmail)
    }

    this.submit()

    return browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function(url) {
        return /devices/.test(url)
      })
    })
  }

  this.doFreshLogin = function(userName, email, password) {
    // Clean up cookies
    browser.executeScript('window.localStorage.clear();')
    browser.executeScript('window.sessionStorage.clear();')
    browser.driver.manage().deleteAllCookies()

    // Procced again through login process
    this.doLogin(userName, email, password)
  }

  this.cleanUp = function() {
    this.username = null
    this.password = null
    this.email = null
  }
}
