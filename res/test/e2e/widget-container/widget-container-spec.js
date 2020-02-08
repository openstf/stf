describe('Widget Container Page', function() {

  var DeviceListPage = require('../devices')
  var deviceListPage = new DeviceListPage()

  var WidgetContainerPage = require('./')
  var widgetContainerObj = new WidgetContainerPage()

  var LoginPage = require('../login')
  var loginPage = new LoginPage()

  it('should display amount of devices used by the user', function() {
    deviceListPage.get()
    deviceListPage.controlAvailableDevice()
    deviceListPage.get()
    widgetContainerObj.getAmountOfAssignedToUserDevices().then(function(amount) {
      expect(amount).toBe('1')
    })
  })

  it('should display user name after login on widget', function() {
    widgetContainerObj.getUserNameFromWidget().then(function(userName) {
      expect(userName.toLowerCase()).toBe(loginPage.getUserName().toLowerCase())
    })
  })

  afterEach(function() {
    // Unassign element if is assigned
    deviceListPage.get()
    deviceListPage.deviceStopUsingBtn.count().then(function(elements) {
      if (elements > 0) {
        deviceListPage.unassignDevice()
      }
    })
  })
})
