describe('Control Page', function () {
  var DeviceListPage = require('../devices')
  var deviceListPage = new DeviceListPage()

  var ControlPage = function () {
    this.get = function () {
      browser.get(protractor.getInstance().baseUrl + 'control')
    }
    this.kickDeviceButton = element.all(by.css('.kick-device')).first()
    this.kickDevice = function () {
      this.openDevicesDropDown()
      this.kickDeviceButton.click()
    }
    this.devicesDropDown = element(by.css('.device-name-text'))
    this.openDevicesDropDown = function () {
      this.devicesDropDown.click()
    }
  }

  var controlPage = new ControlPage()

  it('should control an usable device', function () {
    deviceListPage.controlAvailableDevice()

    browser.waitUrl(/control/)

    //browser.debugger();
    //console.log('after')


    //browser.driver.wait(function () {
    //  return browser.driver.getCurrentUrl().then(function (url) {
    //    return /control/.test(url)
    //  })
    //})

    browser.getLocationAbsUrl().then(function (newUrl) {
      expect(newUrl).toMatch(protractor.getInstance().baseUrl + 'control')
    })
  })

  it('should have a kick button', function () {
    expect(controlPage.kickDeviceButton, true)
  })


  describe('Dashboard', function () {
    var DashboardTab = function () {
      this.shellInput = element(by.model('command'))
      this.shellResults = element.all(by.css('.shell-results')).first()

      this.helloString = 'hello adb'
      this.echoCommand = 'echo "' + this.helloString + '"'
      this.clearCommand = 'clear'
      this.openMenuCommand = 'input keyevent 3'

      this.shellExecute = function (command) {
        this.shellInput.sendKeys(command)
        this.shellInput.sendKeys(protractor.Key.ENTER)
      }
    }
    var dashboardTab = new DashboardTab()

    describe('Shell', function () {

      it('should echo "hello adb" to the adb shell', function () {
        expect(dashboardTab.shellInput.isPresent()).toBe(true)

        dashboardTab.shellExecute(dashboardTab.echoCommand)

        expect(dashboardTab.shellResults.getText()).toBe(dashboardTab.helloString)
      })

      it('should clear adb shell input', function () {
        dashboardTab.shellExecute(dashboardTab.clearCommand)
        expect(dashboardTab.shellResults.getText()).toBeFalsy()
      })

      it('should open and close the menu button trough adb shell', function () {
        dashboardTab.shellExecute(dashboardTab.openMenuCommand)
        dashboardTab.shellExecute(dashboardTab.openMenuCommand)
      })

    })
  })


  it('should stop controlling an usable device', function () {
    controlPage.kickDevice()

    browser.getLocationAbsUrl().then(function (newUrl) {
      expect(newUrl).toBe(protractor.getInstance().baseUrl + 'devices')
    })
  })


})
