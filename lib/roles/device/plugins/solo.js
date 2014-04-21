var syrup = require('syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/sub'))
  .dependency(require('../support/push'))
  .dependency(require('../support/channels'))
  .dependency(require('../support/router'))
  .dependency(require('./identity'))
  .define(function(options, sub, push, channels, router, identity) {
    var log = logger.createLogger('device:plugins:solo')
    var channel = wireutil.makePrivateChannel()

    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
    channels.register(channel, Infinity)

    router.on(wire.ProbeMessage, function() {
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.DeviceIdentityMessage(
          options.serial
        , identity.platform
        , identity.manufacturer
        , identity.operator
        , identity.model
        , identity.version
        , identity.abi
        , identity.sdk
        , new wire.DeviceDisplayMessage(
            identity.display.id
          , identity.display.width
          , identity.display.height
          , identity.display.orientation
          , identity.display.xdpi
          , identity.display.ydpi
          , identity.display.fps
          , identity.display.density
          , identity.display.secure
          , identity.display.url
          )
        , new wire.DeviceBrowsersMessage(
            identity.browsers.selected
          , identity.browsers.apps.map(function(app) {
              return new wire.DeviceBrowserAppMessage(
                app.id
              , app.type
              , app.name
              , app.selected
              )
            })
          )
        , new wire.DevicePhoneMessage(identity.phone)
        ))
      ])
    })

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
