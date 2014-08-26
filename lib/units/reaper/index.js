var Promise = require('bluebird')
var zmq = require('zmq')

var logger = require('../../util/logger')
var wire = require('../../wire')
var wireutil = require('../../wire/util')
var dbapi = require('../../db/api')
var lifecycle = require('../../util/lifecycle')

module.exports = function(options) {
  var log = logger.createLogger('reaper')
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
        lifecycle.fatal()
      })
  }

  timer = setInterval(reap, options.reapInterval)
  log.info('Reaping devices with no heartbeat')

  lifecycle.observe(function() {
    clearTimeout(timer)

    try {
      push.close()
    }
    catch (err) {}
  })
}
