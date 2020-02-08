describe('Device Page', function() {
  describe('Icon View', function() {

    var DeviceListPage = require('./')
    var deviceListPage = new DeviceListPage()

    var LoginPage = require('../login')
    var loginPage = new LoginPage()

    var WidgetContainerPage = require('../widget-container')
    var widgetContainerObj = new WidgetContainerPage()

    it('should go to Devices List page', function() {
      deviceListPage.get()
      browser.getCurrentUrl().then(function(newUrl) {
        expect(newUrl).toBe(browser.baseUrl + 'devices')
      })
    })

    it('should have more than 1 device in the list', function() {
      expect(deviceListPage.numberOfDevices()).toBeGreaterThan(0)
    })

    it('should filter available devices', function() {
      deviceListPage.filterAvailableDevices()
      expect(deviceListPage.searchInput.getAttribute('value')).toBe('state: "available"')
    })

    it('should not display used device if filter is set to - state using', function() {
      deviceListPage.get()
      deviceListPage.filterUsingDevices()
      deviceListPage.getNumberOfFilteredOutDevices().then(function(amount) {
        var filteredOut = amount
        deviceListPage.numberOfDevices().then(function(amount) {
          var notFiltered = amount
          expect(notFiltered - filteredOut).toBe(0)
        })
      })
    })

    it('should have more than 1 device available', function() {
      expect(deviceListPage.devicesUsable.count()).toBeGreaterThan(0)
    })

    it('should have one device usable', function() {
      expect(deviceListPage.availableDevice().getAttribute('class')).toMatch('state-available')
    })

    it('should be able to unassign used device', function() {
      deviceListPage.get()
      deviceListPage.controlAvailableDevice()
      deviceListPage.get()
      deviceListPage.unassignDevice()
      browser.getCurrentUrl().then(function(newUrl) {
        expect(newUrl).toBe(browser.baseUrl + 'devices')
      })
    })

    it('should be able to reuse assign device', function() {
      // Test for issue #1076

      deviceListPage.get()
      deviceListPage.controlAvailableDevice()
      deviceListPage.get()
      deviceListPage.selectAssignedDevice()
      browser.getCurrentUrl().then(function(newUrl) {
         expect(newUrl).toContain(browser.baseUrl + 'control/')
      })
    })

    it('should one device be marked as busy as is used by another user', function() {
      deviceListPage.get()
      deviceListPage.controlAvailableDevice()

      loginPage.doFreshLogin('tester', 'test_user2@login.com')
      deviceListPage.get()
      expect(deviceListPage.getNumberOfBusyDevices()).toBe(1)
    })

    it('should not be able to pick up device marked as busy', function() {
      deviceListPage.get()
      deviceListPage.controlAvailableDevice()

      loginPage.doFreshLogin('tester', 'test_user2@login.com')
      deviceListPage.get()
      deviceListPage.selectBusyDevice()
      browser.getCurrentUrl().then(function(newUrl) {
        expect(newUrl).toContain(browser.baseUrl + 'devices')
     })
    })

    afterEach(function() {
      // Relogin to test account if don't use standard test account
      deviceListPage.get()
      widgetContainerObj.getUserNameFromWidget().then(function(userName) {
        if (userName.toLowerCase() !== loginPage.getUserName().toLowerCase()) {
          loginPage.doFreshLogin()
        }
      })

      // Unassign element if is assigned
      deviceListPage.get()
      deviceListPage.deviceStopUsingBtn.count().then(function(elements) {
        if (elements > 0) {
          deviceListPage.unassignDevice()
        }
      })
    })
  })

  describe('List View', function() {

  })
})
