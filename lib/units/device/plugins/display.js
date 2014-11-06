var syrup = require('stf-syrup')

var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('./service'))
  .dependency(require('./http'))
  .define(function(options, service, http) {
    var log = logger.createLogger('device:plugins:display')

    function fetch() {
      log.info('Fetching display info')
      return service.getDisplay(0)
        .catch(function() {
          log.info('Falling back to HTTP API')
          return http.getDisplay(0)
        })
        .then(function(display) {
          display.url = http.getDisplayUrl(display.id)
          return display
        })
    }

    return fetch()
  })
