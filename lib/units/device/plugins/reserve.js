// npm modules
var events = require('events')

// stf family
var syrup = require('stf-syrup')

// stf utils
var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var lifecycle = require('../../../util/lifecycle')

module.exports = syrup.serial()
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, router, push) {
    var log = logger.createLogger('device:plugins:reserve')
    var plugin = Object.create(null)

    // timer logic here

    // reserve update listener
    router
      .on(wire.ReserveUpdateMessage, function(channel, message) {
        log.debug('ReserveUpdateMessage')
        log.debug(message)
      })

    // initialize
    ;(function() {
      log.debug('initialize process. bloadcas update request')
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.ReserveUpdateRequestMessage(
        ))
      ])
    })()

    lifecycle.observe(function() {
      // stop timer
    })

    return plugin
  })
