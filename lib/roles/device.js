var syrup = require('syrup')

var logger = require('../util/logger')

module.exports = function(options) {
  // Show serial number in logs
  logger.setGlobalIdentifier(options.serial)

  return syrup.serial()
    // We want to send logs before anything else start happening
    .dependency(require('./device/plugins/logsender'))
    .define(function(options) {
      var log = logger.createLogger('device')
      log.info('Preparing device')
      return syrup.serial()
        .dependency(require('./device/plugins/solo'))
        .dependency(require('./device/plugins/heartbeat'))
        .dependency(require('./device/plugins/display'))
        .dependency(require('./device/plugins/http'))
        .dependency(require('./device/plugins/input'))
        .dependency(require('./device/plugins/logcat'))
        .dependency(require('./device/plugins/shell'))
        .dependency(require('./device/plugins/touch'))
        .dependency(require('./device/plugins/install'))
        .dependency(require('./device/plugins/owner'))
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
}
