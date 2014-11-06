var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/push'))
  .define(function(options, push) {
    // Forward all logs
    logger.on('entry', function(entry) {
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.DeviceLogMessage(
          options.serial
        , entry.timestamp / 1000
        , entry.priority
        , entry.tag
        , entry.pid
        , entry.message
        , entry.identifier
        ))
      ])
    })

    return logger
  })
