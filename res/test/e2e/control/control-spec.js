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
    browser.getLocationAbsUrl().then(function (newUrl) {
      expect(newUrl).toMatch(protractor.getInstance().baseUrl + 'control')
    })
  })

  it('should have a kick button', function () {
    expect(controlPage.kickDeviceButton, true)
  })

  it('should stop controlling an usable device', function () {
    controlPage.kickDevice()

    browser.getLocationAbsUrl().then(function (newUrl) {
      expect(newUrl).toBe(protractor.getInstance().baseUrl + 'devices')
    })
  })

  describe('Dashboard', function () {
    describe('Shell', function () {

    })
  })
})
