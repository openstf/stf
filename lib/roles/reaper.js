var util = require('util')

var Promise = require('bluebird')
var zmq = require('zmq')

var logger = require('../util/logger')
var wire = require('../wire')
var wireutil = require('../wire/util')
var dbapi = require('../db/api')

module.exports = function(options) {
  var log = logger.createLogger('reaper')
    , quit = Promise.defer()
    , timer

  if (options.name) {
    logger.setGlobalIdentifier(options.name)
  }

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('Sending output to %s', endpoint)
    push.connect(endpoint)
  })

  function reap() {
    dbapi.getDeadDevices(options.heartbeatTimeout)
      .then(function(cursor) {
        return Promise.promisify(cursor.toArray, cursor)()
          .then(function(list) {
            list.forEach(function(device) {
              log.info('Reaping device "%s"', device.serial)
              push.send([
                wireutil.global
              , wireutil.envelope(new wire.DeviceAbsentMessage(
                  device.serial
                ))
              ])
            })
          })
      })
      .catch(function(err) {
        log.error('Failed to load device list: ', err.message, err.stack)
        quit.reject(err)
      })
  }

  timer = setInterval(reap, options.reapInterval)

  process.on('SIGINT', function() {
    quit.resolve()
  })

  process.on('SIGTERM', function() {
    quit.resolve()
  })

  quit.promise
    .then(function() {
      process.exit(0)
    })
    .catch(function(err) {
      log.fatal('Error caused quit: ', err.stack)
      process.exit(1)
    })

  log.info('Reaping devices with no heartbeat')
}
