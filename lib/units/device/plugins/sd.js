var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('./service'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, service, router, push) {
    var log = logger.createLogger('device:plugins:sd')

    router.on(wire.SdStatusMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)
      log.info('Getting SD card status')
      service.getSdStatus(message)
        .timeout(30000)
        .then(function(mounted) {
          push.send([
            channel
          , reply.okay(mounted ? 'sd_mounted' : 'sd_unmounted')
          ])
        })
        .catch(function(err) {
          log.error('Getting SD card Status', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })
  })
