var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('./group'))
  .dependency(require('./service'))
  .define(function(options, group, service) {
    var log = logger.createLogger('device:plugins:mute')

    if (options.muteMaster) {
      log.info('Will mute master volume during use')

      group.on('join', function() {
        log.info('Muting master volume')
        service.setMasterMute(true)
      })

      group.on('leave', function() {
        log.info('Unmuting master volume')
        service.setMasterMute(false)
      })
    }
    else {
      log.info('Will not mute master volume during use')
    }

    return Promise.resolve()
  })
