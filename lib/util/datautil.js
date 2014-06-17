var deviceData = require('stf-device-db')
var browserData = require('stf-browser-db')

var logger = require('./logger')

var log = logger.createLogger('util:datautil')

var aliases = {
  'KYY22': 'L02'
, 'SH-06DNERV': 'SH-06D_NERV'
}

var datautil = module.exports = Object.create(null)

datautil.applyData = function(device) {
  var model = device.model

  if (model) {
    var match = deviceData[model]

    if (!match) {
      if (aliases[model]) {
        match = deviceData[aliases[model]]
      }
      else {
        if (!match) {
          model = model.replace(/ /g, '_')
          match = deviceData[model]

          if (!match) {
            model = model.replace(/_/g, '')
            match = deviceData[model]
          }
        }
      }
    }

    if (match) {
      device.name = match.name.id
      device.releasedAt = match.date
      device.image = model + '.jpg'
      device.cpu = match.cpu
      device.memory = match.memory
    }
    else {
      log.warn(
        'Device database does not have a match for device "%s" (model "%s")'
      , device.serial
      , device.model
      )
    }
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
