var syrup = require('syrup')

var logger = require('../../../util/logger')
var ChannelManager = require('../../../wire/channelmanager')

module.exports = syrup()
  .define(function(options, router) {
    var log = logger.createLogger('device:plugins:channels')
    var channels = new ChannelManager()
    channels.on('timeout', function(channel) {
      log.info('Channel "%s" timed out', channel)
    })
    return channels
  })
