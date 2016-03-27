module.exports = function DeviceListPage() {
  this.get = function() {
    // TODO: Let's get rid off the login first
    browser.get(protractor.getInstance().baseUrl + 'devices')
  }
  this.devices = element(by.model('tracker.devices'))
  this.devicesByCss = element.all(by.css('ul.devices-icon-view > li'))
  this.devicesUsable = element.all(by.css('.state-available'))
  this.searchInput = element(by.model('search.deviceFilter'))
  this.filterAvailableDevices = function() {
    return this.searchInput.sendKeys('state: "available"')
  }
  this.numberOfDevices = function() {
    return this.devicesByCss.count()
  }
  this.availableDevice = function() {
    return this.devicesUsable.first()
  }
  this.controlAvailableDevice = function() {
    return this.availableDevice().click()
  }
}
