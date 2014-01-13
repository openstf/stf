var assert = require('assert')

var Promise = require('bluebird')
var zmq = require('zmq')
var adbkit = require('adbkit')

module.exports = function(options) {
  var logger = require('../util/logger')
  var log = logger.createLogger('device')

  // Show serial number in logs
  logger.setGlobalIdentifier(options.serial)

  // Input
  var sub = zmq.socket('sub')
  options.endpoints.sub.forEach(function(endpoint) {
    log.info('Receiving input from %s', endpoint)
    sub.connect(endpoint)
  })

  sub.on('message', function() {
    var args = [].slice.call(target)
      , channel = args.unshift()
      , cmd = args.unshift()
  })

  // Respond to messages directed to everyone
  sub.subscribe('ALL')

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('Sending output to %s', endpoint)
    push.connect(endpoint)
  })

  // Introduce worker
  push.send(['HELO', options.serial])

  function gracefullyExit() {
    log.info('Bye')
    process.exit(0)
  }

  process.on('SIGINT', function() {
    gracefullyExit()
  })

  process.on('SIGTERM', function() {
    gracefullyExit()
  })
}
