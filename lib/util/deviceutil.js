var logger = require('./logger')

var log = logger.createLogger('util:deviceutil')

var deviceutil = module.exports = Object.create(null)

deviceutil.isOwnedByUser = function(device, user) {
  return device.present &&
         device.ready &&
         device.owner &&
         device.owner.email === user.email &&
         device.using
}

deviceutil.isAddable = function(device, user) {
  return device.present &&
         device.ready &&
         !device.using &&
         !device.owner
}
