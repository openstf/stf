var syrup = require('syrup')

var zmq = require('zmq')

var logger = require('../../../util/logger')
var wireutil = require('../../../wire/util')

module.exports = syrup()
  .dependency(require('./channels'))
  .define(function(options, channels) {
    var log = logger.createLogger('device:support:sub')

    // Input
    var sub = zmq.socket('sub')
    options.endpoints.sub.forEach(function(endpoint) {
      log.info('Receiving input from %s', endpoint)
      sub.connect(endpoint)
    })

    // Establish always-on channels
    ;[wireutil.global].forEach(function(channel) {
      log.info('Subscribing to permanent channel "%s"', channel)
      sub.subscribe(channel)
      channels.register(channel, Infinity)
    })

    return sub
  })
