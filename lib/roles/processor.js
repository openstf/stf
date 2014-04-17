var zmq = require('zmq')

var logger = require('../util/logger')
var wire = require('../wire')
var wirerouter = require('../wire/router')
var wireutil = require('../wire/util')
var dbapi = require('../db/api')
var lifecycle = require('../util/lifecycle')

module.exports = function(options) {
  var log = logger.createLogger('processor')

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

  devDealer.on('message', wirerouter()
    // Initial device message
    .on(wire.DevicePresentMessage, function(channel, message, data) {
      dbapi.saveDevice(message.serial, message)
        .then(function() {
          devDealer.send([
            message.provider.channel
          , wireutil.envelope(new wire.DeviceRegisteredMessage(
              message.serial
            ))
          ])
          appDealer.send([channel, data])
        })
    })
    // Workerless messages
    .on(wire.DeviceAbsentMessage, function(channel, message, data) {
      dbapi.setDeviceAbsent(message.serial)
      appDealer.send([channel, data])
    })
    .on(wire.DeviceStatusMessage, function(channel, message, data) {
      dbapi.saveDeviceStatus(message.serial, message.status)
      appDealer.send([channel, data])
    })
    // Worker initialized
    .on(wire.DevicePokeMessage, function(channel, message) {
      dbapi.setDeviceChannel(message.serial, message.channel)
        .then(function() {
          devDealer.send([
            message.channel
          , wireutil.envelope(new wire.ProbeMessage())
          ])
        })
    })
    // Worker messages
    .on(wire.DeviceHeartbeatMessage, function(channel, message) {
      dbapi.updateDeviceHeartbeat(message.serial)
    })
    .on(wire.JoinGroupMessage, function(channel, message, data) {
      dbapi.setDeviceOwner(message.serial, message.owner)
      appDealer.send([channel, data])
    })
    .on(wire.LeaveGroupMessage, function(channel, message, data) {
      dbapi.unsetDeviceOwner(message.serial, message.owner)
      appDealer.send([channel, data])
    })
    .on(wire.DeviceLogMessage, function(channel, message, data) {
      dbapi.saveDeviceLog(message.serial, message)
      appDealer.send([channel, data])
    })
    .on(wire.DeviceIdentityMessage, function(channel, message, data) {
      dbapi.saveDeviceIdentity(message.serial, message)
      appDealer.send([channel, data])
    })
    .on(wire.TransactionProgressMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.TransactionDoneMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.DeviceLogcatEntryMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .handler())

  lifecycle.observe(function() {
    appDealer.close()
    devDealer.close()
  })
}
