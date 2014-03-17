var Promise = require('bluebird')
var syrup = require('syrup')

var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .define(function(options) {
    var log = logger.createLogger('device:support:quit')
    var cleanup = []

    function graceful() {
      log.info('Winding down for graceful exit')

      var wait = Promise.all(cleanup.map(function(fn) {
        return fn()
      }))

      return wait.then(function() {
        process.exit(0)
      })
    }

    function fatal() {
      log.fatal('Shutting down due to fatal error')
      process.exit(1)
    }

    process.on('SIGINT', graceful)
    process.on('SIGTERM', graceful)

    return {
      graceful: graceful
    , fatal: fatal
    , observe: function(promise) {
        cleanup.push(promise)
      }
    }
  })
