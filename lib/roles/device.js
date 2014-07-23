var syrup = require('syrup')

var logger = require('../util/logger')
var lifecycle = require('../util/lifecycle')

module.exports = function(options) {
  // Show serial number in logs
  logger.setGlobalIdentifier(options.serial)

  var log = logger.createLogger('device')

  return syrup.serial()
    // We want to send logs before anything else starts happening
    .dependency(require('./device/plugins/logger'))
    .define(function(options) {
      var log = logger.createLogger('device')
      log.info('Preparing device')
      return syrup.serial()
        .dependency(require('./device/plugins/solo'))
        .dependency(require('./device/plugins/screenshot'))
        .dependency(require('./device/plugins/http'))
        .dependency(require('./device/plugins/service'))
        .dependency(require('./device/plugins/display'))
        .dependency(require('./device/plugins/browser'))
        .dependency(require('./device/plugins/store'))
        .dependency(require('./device/plugins/clipboard'))
        .dependency(require('./device/plugins/logcat'))
        .dependency(require('./device/plugins/shell'))
        .dependency(require('./device/plugins/touch'))
        .dependency(require('./device/plugins/install'))
        .dependency(require('./device/plugins/forward'))
        .dependency(require('./device/plugins/group'))
        .dependency(require('./device/plugins/reboot'))
        .dependency(require('./device/plugins/connect'))
        .dependency(require('./device/plugins/account'))
        .dependency(require('./device/plugins/ringer'))
        .dependency(require('./device/plugins/wifi'))
        .dependency(require('./device/plugins/sd'))
        .define(function(options, solo) {
          if (process.send) {
            // Only if we have a parent process
            process.send('ready')
          }
          log.info('Fully operational')
          return solo.poke()
        })
        .consume(options)
    })
    .consume(options)
    .catch(function(err) {
      log.fatal('Setup had an error', err.stack)
      lifecycle.fatal()
    })
}
