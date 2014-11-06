var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var ChannelManager = require('../../../wire/channelmanager')

module.exports = syrup.serial()
  .define(function() {
    var log = logger.createLogger('device:support:channels')
    var channels = new ChannelManager()
    channels.on('timeout', function(channel) {
      log.info('Channel "%s" timed out', channel)
    })
    return channels
  })
