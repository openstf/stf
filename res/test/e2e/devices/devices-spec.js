describe('Device Page', function() {
  describe('Icon View', function() {

    var DeviceListPage = require('./')
    var deviceListPage = new DeviceListPage()

    it('should go to Devices List page', function() {
      deviceListPage.get()
      browser.getLocationAbsUrl().then(function(newUrl) {
        expect(newUrl).toBe(protractor.getInstance().baseUrl + 'devices')
      })
    })

    it('should have more than 1 device in the list', function() {
      expect(deviceListPage.numberOfDevices()).toBeGreaterThan(0)
    })

    it('should filter available devices', function() {
      deviceListPage.filterAvailableDevices()
      expect(deviceListPage.searchInput.getAttribute('value')).toBe('state: "available"')
    })

    it('should have more than 1 device available', function() {
      expect(deviceListPage.devicesUsable.count()).toBeGreaterThan(0)
    })

    it('should have one device usable', function() {
      expect(deviceListPage.availableDevice().getAttribute('class')).toMatch('state-available')
    })

  })

  describe('List View', function() {

  })
})
