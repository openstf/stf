var syrup = require('syrup')

var zmq = require('zmq')

var logger = require('../../../util/logger')

module.exports = syrup()
  .define(function(options) {
    var log = logger.createLogger('device:plugins:push')

    // Output
    var push = zmq.socket('push')
    options.endpoints.push.forEach(function(endpoint) {
      log.info('Sending output to %s', endpoint)
      push.connect(endpoint)
    })

    return push
  })
