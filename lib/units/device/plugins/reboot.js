var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, adb, router, push) {
    var log = logger.createLogger('device:plugins:reboot')

    router.on(wire.RebootMessage, function(channel) {
      var reply = wireutil.reply(options.serial)

      log.important('Rebooting')

      adb.reboot(options.serial)
        .timeout(30000)
        .then(function() {
          push.send([
            channel
          , reply.okay()
          ])
        })
        .error(function(err) {
          log.error('Reboot failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })
  })
