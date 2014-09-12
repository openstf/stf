var deviceData = require('stf-device-db')
var browserData = require('stf-browser-db')

var logger = require('./logger')

var log = logger.createLogger('util:datautil')

var datautil = module.exports = Object.create(null)

datautil.applyData = function(device) {
  var match = deviceData.find({
    model: device.model
  , name: device.product
  })

  if (match) {
    device.name = match.name.id
    device.releasedAt = match.date
    device.image = match.image
    device.cpu = match.cpu
    device.memory = match.memory
    if (match.display && match.display.s) {
      device.display = device.display || {}
      device.display.inches = match.display.s
    }
  }
  else {
    log.warn(
      'Device database does not have a match for device "%s" (model "%s"/"%s")'
    , device.serial
    , device.model
    , device.product
    )
  }

  return device
}

datautil.applyBrowsers = function(device) {
  if (device.browser) {
    device.browser.apps.forEach(function(app) {
      var data = browserData[app.type]
      if (data) {
        app.developer = data.developer
      }
    })
  }
  return device
}

datautil.applyOwner = function(device, user) {
  device.using = !!device.owner && device.owner.email === user.email
  return device
}

datautil.normalize = function(device, user) {
  datautil.applyData(device)
  datautil.applyBrowsers(device)
  datautil.applyOwner(device, user)
  if (!device.present) {
    device.owner = null
  }
}
