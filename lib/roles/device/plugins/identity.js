var syrup = require('syrup')

var devutil = require('../../../util/devutil')
var logger = require('../../../util/logger')

module.exports = syrup()
  .dependency(require('./adb'))
  .define(function(options, adb) {
    var log = logger.createLogger('device:plugins:identity')

    function solve() {
      log.info('Solving identity')
      return adb.getProperties(options.serial)
        .then(function(properties) {
          return devutil.makeIdentity(options.serial, properties)
        })
    }

    return solve()
  })
