var syrup = require('stf-syrup')

var logger = require('../../util/logger')
var lifecycle = require('../../util/lifecycle')

module.exports = function(options) {
  // Show serial number in logs
  logger.setGlobalIdentifier(options.serial)

  var log = logger.createLogger('device')

  return syrup.serial()
    // We want to send logs before anything else starts happening
    .dependency(require('./plugins/logger'))
    .define(function(options) {
      var log = logger.createLogger('device')
      log.info('Preparing device')
      return syrup.serial()
        .dependency(require('./plugins/heartbeat'))
        .dependency(require('./plugins/solo'))
        .dependency(require('./plugins/screen/stream'))
        .dependency(require('./plugins/screen/capture'))
        .dependency(require('./plugins/vnc'))
        .dependency(require('./plugins/service'))
        .dependency(require('./plugins/browser'))
        .dependency(require('./plugins/store'))
        .dependency(require('./plugins/clipboard'))
        .dependency(require('./plugins/logcat'))
        .dependency(require('./plugins/mute'))
        .dependency(require('./plugins/shell'))
        .dependency(require('./plugins/touch'))
        .dependency(require('./plugins/install'))
        .dependency(require('./plugins/forward'))
        .dependency(require('./plugins/group'))
        .dependency(require('./plugins/cleanup'))
        .dependency(require('./plugins/reboot'))
        .dependency(require('./plugins/connect'))
        .dependency(require('./plugins/account'))
        .dependency(require('./plugins/ringer'))
        .dependency(require('./plugins/wifi'))
        .dependency(require('./plugins/sd'))
        .dependency(require('./plugins/filesystem'))
        .define(function(options, heartbeat, solo) {
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
