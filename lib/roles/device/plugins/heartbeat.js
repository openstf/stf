var syrup = require('syrup')

var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/push'))
  .define(function(options, push) {
    function heartbeat() {
      push.send([
        wireutil.heartbeat
      , wireutil.envelope(new wire.DeviceHeartbeatMessage(
          options.serial
        ))
      ])
      setTimeout(heartbeat, options.heartbeatInterval)
    }

    heartbeat()
  })
