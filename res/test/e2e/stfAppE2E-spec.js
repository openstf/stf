describe('STF App', function () {
  var config = {
    baseUrl: 'http://localhost:7100/#!',
    loginBaseUrl: 'http://localhost:7120'
  }

  describe('Login Page', function () {
    var LoginPage = function () {
      this.get = function () {
        return browser.get(config.loginBaseUrl)
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

    var loginPage = new LoginPage()

    it('should login with auth-mock', function () {
      loginPage.get()

      loginPage.setName('test_user')
      loginPage.setEmail('test_user@test.local')

      loginPage.submit().then(function () {
        browser.getLocationAbsUrl().then(function (newUrl) {
          expect(newUrl).toBe(config.baseUrl + '/devices')
        })
      })
    })
  })

  describe('Device List Page', function () {
    var DeviceListPage = function () {
      this.get = function () {
        // TODO: Let's get rid off the login first
        browser.get(config.baseUrl + '/devices')
      }
      this.rootClass = $$('.stf-device-list')
      this.devices = element(by.model('tracker.devices'))
      this.devicesRepeated = element.all(
        by.repeater('device in tracker.devices'))
    }

    var deviceListPage = new DeviceListPage()

    it('should show a list of devices', function () {
//      console.log(deviceListPage.devices)
//      expect(deviceListPage.devices.isPresent()).toBe(true)
    })

    it('should filter out all the devices', function () {

    })
  })

  describe('Control Page', function () {
    var DeviceListPage = function () {
      this.get = function () {
        browser.get(config.baseUrl + '/control')
      }
    }

  })

  describe('Settings Page', function () {
    var SettingsPage = function () {
      this.get = function () {
        browser.get(config.baseUrl + '/settings')
      }
    }

  })

  describe('Help Page', function () {
    var HelpPage = function () {
      this.get = function () {
        browser.get(config.baseUrl + '/help')
      }
    }

  })
})
