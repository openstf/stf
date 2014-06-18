var syrup = require('syrup')
var deviceData = require('stf-device-db')

var devutil = require('../../../util/devutil')
var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('../support/properties'))
  .dependency(require('./display'))
  .dependency(require('./phone'))
  .define(function(options, properties, display, phone) {
    var log = logger.createLogger('device:plugins:identity')

    function solve() {
      log.info('Solving identity')
      var identity = devutil.makeIdentity(options.serial, properties)
      identity.display = display
      identity.phone = phone
      return identity
    }

    return solve()
  })
