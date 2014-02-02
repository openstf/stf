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
    .on(wire.MessageType.JoinGroupMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.MessageType.LeaveGroupMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.MessageType.DeviceLogMessage, function(channel, message, data) {
      dbapi.saveDeviceLog(message.serial, message)
      appDealer.send([channel, data])
    })
    .on(wire.MessageType.DevicePokeMessage, function(channel, message) {
      devDealer.send([message.channel, wireutil.makeProbeMessage()])
    })
    .on(wire.MessageType.DeviceIdentityMessage, function(channel, message) {
      dbapi.saveDeviceIdentity(message.serial, message)
    })
    .on(wire.MessageType.DeviceStatusMessage, function(channel, message) {
      dbapi.saveDeviceStatus(message.serial, message)
    })
    .on(wire.MessageType.DeviceShellCommandDataMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.MessageType.DeviceShellCommandDoneMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.MessageType.DeviceShellCommandFailMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .handler())
}
