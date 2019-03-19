var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/sub'))
  .define(function(options, adb, router, push, sub) {
    var log = logger.createLogger('device:plugins:worker')

    router.on(wire.WorkerRestartMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)
      log.info('Shutdown worker for device "%s"', options.serial)
      push.send([
        channel,
        reply.okay('')
      ])

      var resolver = Promise.defer()
      resolver.resolve()
      return resolver.promise.finally(function() {
        sub.unsubscribe(channel)
        process.exit(123)
      })
    })
  })
