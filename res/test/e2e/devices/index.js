module.exports = function DeviceListPage() {

  this.get = function() {
    browser.get(browser.baseUrl + 'devices')
    browser.wait(waitUrl(/devices/), 5000)
  }

  this.devices = element(by.model('tracker.devices'))
  this.deviceStopUsingBtn = element.all(by.css('.state-using'))
  this.devicesByCss = element.all(by.css('ul.devices-icon-view > li'))
  this.devicesUsable = element.all(by.css('.state-available'))
  this.devicesBusy = element.all(by.css('.state-busy'))
  this.searchInput = element(by.model('search.deviceFilter'))
  this.devicesFilteredOut = element.all(by.xpath('//*[contains(@class, "filter-out")]'))

  this.filterAvailableDevices = function() {
    return this.searchInput.sendKeys('state: "available"')
  }

  this.filterUsingDevices = function() {
    return this.searchInput.sendKeys('state: "using"')
  }

  this.numberOfDevices = function() {
    return this.devicesByCss.count().then(function(amount) {
      return amount
    })
  }

  this.getNumberOfFilteredOutDevices = function() {
    return this.devicesFilteredOut.count().then(function(amount) {
      return amount
    })
  }

  this.getNumberOfBusyDevices = function() {
    return this.devicesBusy.count().then(function(amount) {
      return amount
    })
  }

  this.availableDevice = function() {
    return this.devicesUsable.first()
  }

  this.controlAvailableDevice = function() {
    this.availableDevice().click()
    browser.wait(waitUrl(/control/), 5000)
  }

  this.assignedDevice = function() {
    return this.deviceStopUsingBtn.first()
  }

  this.getFirstBusyDevice = function() {
    return this.devicesBusy.first()
  }

  this.unassignDevice = function() {
    return this.assignedDevice().click()
  }

  this.selectAssignedDevice = function() {
    return this.assignedDevice().element(by.xpath('..')).click()
  }

  this.selectBusyDevice = function() {
    return this.getFirstBusyDevice().element(by.xpath('..')).click()
  }
}
