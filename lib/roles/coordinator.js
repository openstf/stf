var zmq = require('zmq')

var logger = require('../util/logger')
var wire = require('../wire')
var wireutil = require('../util/wireutil')(wire)
var dbapi = require('../db/api')

module.exports = function(options) {
  var log = logger.createLogger('coordinator')

  if (options.name) {
    logger.setGlobalIdentifier(options.name)
  }

  // App side
  var appDealer = zmq.socket('dealer')
  options.endpoints.appDealer.forEach(function(endpoint) {
    log.info('App dealer connected to %s', endpoint)
    appDealer.connect(endpoint)
  })

  appDealer.on('message', function(channel, data) {
    devDealer.send([channel, data])
  })

  // Device side
  var devDealer = zmq.socket('dealer')
  options.endpoints.devDealer.forEach(function(endpoint) {
    log.info('Device dealer connected to %s', endpoint)
    devDealer.connect(endpoint)
  })

  devDealer.on('message', function(channel, data) {
    var wrapper = wire.Envelope.decode(data)
    switch (wrapper.type) {
      case wire.MessageType.JOIN_GROUP:
        var message = wire.JoinGroupMessage.decode(wrapper.message)
        appDealer.send([channel, data])
        break
      case wire.MessageType.LEAVE_GROUP:
        var message = wire.LeaveGroupMessage.decode(wrapper.message)
        appDealer.send([channel, data])
        break
      case wire.MessageType.DEVICE_POKE:
        var message = wire.DevicePokeMessage.decode(wrapper.message)
        devDealer.send([message.channel, wireutil.makeProbeMessage()])
        break
      case wire.MessageType.DEVICE_IDENTITY:
        var message = wire.DeviceIdentityMessage.decode(wrapper.message)
        dbapi.saveDeviceIdentity(message.serial, message)
        break
      case wire.MessageType.DEVICE_STATUS:
        var message = wire.DeviceStatusMessage.decode(wrapper.message)
        dbapi.saveDeviceStatus(message.serial, message.status)
        break
      case wire.MessageType.DEVICE_PROPERTIES:
        var message = wire.DevicePropertiesMessage.decode(wrapper.message)
        break
      case wire.MessageType.DEVICE_DATA:
        var message = wire.DeviceDataMessage.decode(wrapper.message)
        appDealer.send([channel, data])
        break
      case wire.MessageType.DEVICE_DONE:
        var message = wire.DeviceDoneMessage.decode(wrapper.message)
        appDealer.send([channel, data])
        break
      case wire.MessageType.DEVICE_FAIL:
        var message = wire.DeviceFailMessage.decode(wrapper.message)
        appDealer.send([channel, data])
        break
    }
  })
}
