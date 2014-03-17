var Promise = require('bluebird')
var syrup = require('syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup()
  .dependency(require('../support/push'))
  .dependency(require('../support/quit'))
  .define(function(options, push, quit) {
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

    quit.observe(function() {
      // Let's give it some time to flush logs before dying
      return Promise.delay(500)
    })

    return logger
  })
