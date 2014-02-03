var zmq = require('zmq')

var logger = require('../util/logger')
var wire = require('../wire')
var wirerouter = require('../wire/router')
var wireutil = require('../wire/util')
var dbapi = require('../db/api')

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
    .on(wire.JoinGroupMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.LeaveGroupMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.DeviceLogMessage, function(channel, message, data) {
      dbapi.saveDeviceLog(message.serial, message)
      appDealer.send([channel, data])
    })
    .on(wire.DevicePokeMessage, function(channel, message) {
      dbapi.ensureDeviceSaved(message.serial)
        .then(function() {
          devDealer.send([message.channel, wireutil.makeProbeMessage()])
        })
    })
    .on(wire.DeviceIdentityMessage, function(channel, message) {
      dbapi.saveDeviceIdentity(message.serial, message)
    })
    .on(wire.DeviceStatusMessage, function(channel, message) {
      dbapi.saveDeviceStatus(message.serial, message)
    })
    .on(wire.ShellCommandDataMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.ShellCommandDoneMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.ShellCommandFailMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .handler())
}
