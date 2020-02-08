describe('Control Page', function() {
  var DeviceListPage = require('../devices')
  var deviceListPage = new DeviceListPage()
  var localhost = browser.baseUrl

  var ControlPage = function() {
    this.get = function() {
      browser.get(localhost + 'control')
    }

    this.kickDeviceButton = element.all(by.css('.kick-device'))
    this.devicesDropDown = element(by.css('.device-name-text'))

    this.openDevicesDropDown = function() {
      return this.devicesDropDown.click()
    }

    this.getFirstKickDeviceButton = function() {
      return this.kickDeviceButton.first()
    }

    this.kickDevice = function() {
      this.openDevicesDropDown()
      this.getFirstKickDeviceButton().click()
    }
  }

  var controlPage = new ControlPage()

  it('should control an usable device', function() {
    deviceListPage.controlAvailableDevice()

    waitUrl(/control/)

    browser.sleep(500)

    browser.getCurrentUrl().then(function(newUrl) {
      expect(newUrl).toContain(localhost + 'control/')
    })
  })

  it('should have a kick button', function() {
    expect(controlPage.kickDeviceButton.isPresent()).toBeTruthy()
  })

  describe('Remote Control', function() {
    //var RemoteCtrl = function () {
    //  this.paneHandleHorizontal = element(by.css('.fa-pane-handle.horizontal'))
    //}
    it('should resize panel to the right', function() {

    })
    it('should rotate device', function() {

    })
  })


  describe('Dashboard Tab', function() {

    describe('Shell', function() {
      var ShellCtrl = function() {
        this.commandInput = element(by.model('command'))
        this.results = element.all(by.css('.shell-results')).first()

        this.helloString = 'hello adb'
        this.echoCommand = 'echo "' + this.helloString + '"'
        this.clearCommand = 'clear'
        this.openMenuCommand = 'input keyevent 3'

        this.execute = function(command) {
          this.commandInput.sendKeys(command, protractor.Key.ENTER)
        }
      }
      var shell = new ShellCtrl()

      it('should echo "hello adb" to the adb shell', function() {
        expect(shell.commandInput.isPresent()).toBe(true)

        shell.execute(shell.echoCommand)

        expect(shell.results.getText()).toBe(shell.helloString)
      })

      it('should clear adb shell input', function() {
        shell.execute(shell.clearCommand)
        expect(shell.results.getText()).toBeFalsy()
      })

      it('should open and close the menu button trough adb shell', function() {
        shell.execute(shell.openMenuCommand)
        shell.execute(shell.openMenuCommand)
      })

    })

    describe('Navigation', function() {
      var NavigationCtrl = function() {
        this.urlInput = element(by.model('textURL'))
        this.goToUrl = function(url) {
          this.urlInput.sendKeys(url, protractor.Key.ENTER)
        }
        this.resetButton = element(by.css('[ng-click="clearSettings()"]'))
      }
      var navigation = new NavigationCtrl()

      it('should go to an URL', function() {
        var url = 'google.com'
        navigation.goToUrl(url)
        expect(navigation.urlInput.getAttribute('value')).toBe(url)

        browser.sleep(500)
      })

      it('should clear the URL input', function() {
        navigation.urlInput.clear()
        expect(navigation.urlInput.getAttribute('value')).toBeFalsy()
      })

      it('should reset browser settings', function() {
        navigation.resetButton.click()
      })
    })

  })

  describe('Screenshots Tab', function() {

  })

  describe('Automation Tab', function() {

  })

  describe('Advanced Tab', function() {

  })

  describe('Logs Tab', function() {

  })

  it('should stop controlling an usable device', function() {
    controlPage.kickDevice()

    browser.wait(waitUrl(/devices/), 5000)

    browser.getCurrentUrl().then(function(newUrl) {
      expect(newUrl).toBe(localhost + 'devices')
    })
  })


})
