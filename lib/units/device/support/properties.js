var syrup = require('stf-syrup')

var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('./adb'))
  .define(function(options, adb) {
    var log = logger.createLogger('device:support:properties')

    function load() {
      log.info('Loading properties')
      return adb.getProperties(options.fixed_serial)
        .timeout(10000)
    }

    return load()
  })
