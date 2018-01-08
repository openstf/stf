var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('./service'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, service, router, push) {
    var log = logger.createLogger('device:plugins:bluetooth')

    router.on(wire.BluetoothSetEnabledMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)
      log.info('Setting Bluetooth "%s"', message.enabled)
      service.setBluetoothEnabled(message.enabled)
        .timeout(30000)
        .then(function() {
          push.send([
            channel
          , reply.okay()
          ])
        })
        .catch(function(err) {
          log.error('Setting Bluetooth enabled failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    router.on(wire.BluetoothGetStatusMessage, function(channel) {
      var reply = wireutil.reply(options.serial)
      log.info('Getting Bluetooth status')
      service.getBluetoothStatus()
        .timeout(30000)
        .then(function(enabled) {
          push.send([
            channel
          , reply.okay(enabled ? 'bluetooth_enabled' : 'bluetooth_disabled')
          ])
        })
        .catch(function(err) {
          log.error('Getting Bluetooth status failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })
  })
