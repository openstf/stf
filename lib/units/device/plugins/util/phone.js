var syrup = require('stf-syrup')

var logger = require('../../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('../service'))
  .define(function(options, service) {
    var log = logger.createLogger('device:plugins:phone')

    function fetch() {
      log.info('Fetching phone info')
      return service.getProperties([
        'imei'
      , 'phoneNumber'
      , 'iccid'
      , 'network'
      ])
    }

    return fetch()
  })
