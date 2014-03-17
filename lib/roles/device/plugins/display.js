var syrup = require('syrup')

var logger = require('../../../util/logger')

module.exports = syrup()
  .dependency(require('./http'))
  .define(function(options, http) {
    var log = logger.createLogger('device:plugins:display')

    function fetch() {
      log.info('Fetching display info')
      return http.getDisplay(0)
    }

    return fetch()
  })
