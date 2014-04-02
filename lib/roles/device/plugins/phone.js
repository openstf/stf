var syrup = require('syrup')

var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('./input'))
  .define(function(options, input) {
    var log = logger.createLogger('device:plugins:phone')

    function fetch() {
      log.info('Fetching phone info')
      return input.getProperties(['imei', 'phoneNumber'])
    }

    return fetch()
  })
