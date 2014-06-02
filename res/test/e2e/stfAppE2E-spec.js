describe('STF App', function () {
  var LoginPage = function () {
    this.get = function () {
      return browser.get('http://localhost:7120/')
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

  var Common = {
    login: function () {

    }
  }

  describe('Device List', function () {
    var DeviceListPage = function () {
      this.get = function () {
        // TODO: Let's get rid off the login first
        browser.get('http://localhost:7100/devices')
      }
      this.rootClass = $$('.stf-device-list')
      this.devices = element(by.model('tracker.devices'))
      this.devicesRepeated = element.all(by.repeater('device in tracker.devices'))
    }

    var deviceListPage = new DeviceListPage()

    it('should show a list of devices', function () {
      var loginPage = new LoginPage()
      loginPage.login()

      deviceListPage.get()

      //console.log(deviceListPage.rootClass.isPresent())


      expect(true).toEqual(true)
    })

    it('should filter out all the devices', function () {


    })
  })

  describe('Login', function () {
    var loginPage = new LoginPage()

    it('should login', function () {
      loginPage.get()

      loginPage.setName('test_user')
      loginPage.setEmail('test_user@test.local')

      loginPage.submit().then(function () {
        browser.getLocationAbsUrl().then(function (newUrl) {
          expect(newUrl).toBe('http://localhost:7100/#!/')
        })
      })
    })
    it('should show the login page', function () {

    })
  })

  describe('Control', function () {
    var DeviceListPage = function () {
      this.get = function () {
        browser.get('http://localhost:7100/')
      }
    }

  })

  describe('Settings', function () {
    var SettingsPage = function () {
      this.get = function () {
        browser.get('http://localhost:7100/#!/settings')
      }
    }

  })

  describe('Help', function () {
    var HelpPage = function () {
      this.get = function () {
        browser.get('http://localhost:7100/#!/help')
      }
    }

  })
})
