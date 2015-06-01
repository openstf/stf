var syrup = require('stf-syrup')

var lifecycle = require('../../../util/lifecycle')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/push'))
  .define(function(options, push) {
    function beat() {
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.DeviceHeartbeatMessage(
          options.serial
        ))
      ])
    }

    var timer = setInterval(beat, options.heartbeatInterval)

    lifecycle.observe(function() {
      clearInterval(timer)
    })
  })
