var syrup = require('syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup()
  .dependency(require('../support/sub'))
  .dependency(require('../support/push'))
  .dependency(require('../support/channels'))
  .define(function(options, sub, push, channels) {
    var log = logger.createLogger('device:plugins:solo')
    var channel = wireutil.makePrivateChannel()

    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
    channels.register(channel, Infinity)


    return {
      channel: channel
    , poke: function() {
        push.send([
          wireutil.global
        , wireutil.envelope(new wire.DevicePokeMessage(
            options.serial
          , channel
          ))
        ])
      }
    }
  })
