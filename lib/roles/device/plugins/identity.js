var syrup = require('syrup')

var devutil = require('../../../util/devutil')
var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('../support/properties'))
  .dependency(require('./display'))
  .dependency(require('./browsers'))
  .define(function(options, properties, display, browsers) {
    var log = logger.createLogger('device:plugins:identity')

    function solve() {
      log.info('Solving identity')
      var identity = devutil.makeIdentity(options.serial, properties)
      identity.display = display
      identity.browsers = browsers
      return identity
    }

    return solve()
  })
