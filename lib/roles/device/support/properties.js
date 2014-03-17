var syrup = require('syrup')

var devutil = require('../../../util/devutil')
var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('./adb'))
  .define(function(options, adb) {
    var log = logger.createLogger('device:support:properties')

    function load() {
      log.info('Loading properties')
      return adb.getProperties(options.serial)
    }

    return load()
  })
