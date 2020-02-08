module.exports = function WidgetContainerPage() {

  this.get = function() {
    browser.get(browser.baseUrl + 'devices')
    browser.wait(waitUrl(/devices/), 5000)
  }

  this.userName = element(by.binding('currentUser.name'))
  this.amountOfAssignedToUserDevices = element(by.xpath('//*[@class="number color-orange"]/span'))

  this.getUserNameFromWidget = function() {
    return this.userName.getText()
  }

  this.getAmountOfAssignedToUserDevices = function() {
    return this.amountOfAssignedToUserDevices.getText()
  }
}
