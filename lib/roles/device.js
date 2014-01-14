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

  sub.on('message', function(channel, id, cmd) {
    push.send([id, options.serial, 'ACK'])
    switch (cmd.toString()) {
      case 'ls':
        log.info('Responding to "ls"')
        push.send([id, options.serial, 'OKY'])
        break
      case 'shell':
        var line = arguments[3]
        log.info('Running shell command "%s"', line)
        adb.shellAsync(options.serial, line)
          .then(function(out) {
            var chunks = []
            out.on('data', function(chunk) {
              chunks.push(chunk)
            })
            out.on('end', function(chunk) {
              push.send([id, options.serial, 'OKY', Buffer.concat(chunks)])
            })
          })
          .catch(function(err) {
            push.send([id, options.serial, 'ERR', err.message])
          })
        break
      default:
        log.warn('Unknown command "%s"', cmd)
        break
    }
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
  // push.send(['HELO', options.serial])

  // Adb
  var adb = Promise.promisifyAll(adbkit.createClient())

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
