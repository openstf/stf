var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('./service'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, service, router, push) {
    var log = logger.createLogger('device:plugins:ringer')

    router.on(wire.RingerSetMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)

      log.info('Setting ringer mode to mode "%s"', message.mode)

      service.setRingerMode(message.mode)
        .timeout(30000)
        .then(function() {
          push.send([
            channel
          , reply.okay()
          ])
        })
        .catch(function(err) {
          log.error('Setting ringer mode failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    router.on(wire.RingerGetMessage, function(channel) {
      var reply = wireutil.reply(options.serial)

      log.info('Getting ringer mode')

      service.getRingerMode()
        .timeout(30000)
        .then(function(mode) {
          push.send([
            channel
          , reply.okay('success', mode)
          ])
        })
        .catch(function(err) {
          log.error('Getting ringer mode failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })
  })
