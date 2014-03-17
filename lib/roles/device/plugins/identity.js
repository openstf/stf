var syrup = require('syrup')

var devutil = require('../../../util/devutil')
var logger = require('../../../util/logger')

module.exports = syrup()
  .dependency(require('../support/properties'))
  .dependency(require('./display'))
  .define(function(options, properties, display) {
    var log = logger.createLogger('device:plugins:identity')

    function solve() {
      log.info('Solving identity')
      var identity = devutil.makeIdentity(options.serial, properties)
      identity.display = display
      return identity
    }

    return solve()
  })
