var syrup = require('stf-syrup')

var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('./service'))
  .dependency(require('./screen'))
  .define(function(options, service, screen) {
    var log = logger.createLogger('device:plugins:display')

    function fetch() {
      log.info('Fetching display info')
      return service.getDisplay(0)
        .catch(function() {
          log.info('Falling back to screen API')
          return screen.info(0)
        })
        .then(function(display) {
          display.url = screen.publicUrl
          return display
        })
    }

    return fetch()
  })
