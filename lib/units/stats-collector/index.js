var Promise = require('bluebird')

var logger = require('../../util/logger')
var wire = require('../../wire')
var wireutil = require('../../wire/util')
var wirerouter = require('../../wire/router')
var db = require('../../db')
var dbapi = require('../../db/api')
var lifecycle = require('../../util/lifecycle')
var srv = require('../../util/srv')
var zmqutil = require('../../util/zmqutil')
var uuid = require('uuid')

var serialLeaseMap = {}
var defaultIntervalMinutes = 5

var updateDeviceLastSeen = function(leaseId, serial) {
  if (serialLeaseMap[serial]) {
    dbapi.markEndOfDeviceUsage(serialLeaseMap[serial], new Date())
    // schedule next update
    setTimeout(function() {
      updateDeviceLastSeen(leaseId, serial)
    }, defaultIntervalMinutes * 60 * 1000)
  }
}

module.exports = db.ensureConnectivity(function(options) {
  var log = logger.createLogger('stats')
  log.important('starting stats-collector unit')
  // Device side
  var sub = zmqutil.socket('sub')
  Promise.map(options.endpoints.sub, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.important('Receiving input from "%s"', record.url)
        sub.connect(record.url)
        return Promise.resolve(true)
      })
    })
  }).catch(function(err) {
    log.fatal('Unable to connect to sub endpoint', err)
    lifecycle.fatal()
  })

  // Establish always-on channels
  ;[wireutil.global].forEach(function(channel) {
    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
  })

  sub.on('message', wirerouter()
  .on(wire.JoinGroupMessage, function(channel, message) {
    var serial = message.serial
    dbapi.loadDevice(serial).then(function(device) {
      serialLeaseMap[serial] = uuid.v4()
      var startAt = new Date()
      var defaultEndsAt = new Date(
        startAt.getTime() + defaultIntervalMinutes * 60 * 1000
      )
      log.info('Created new lease id', serialLeaseMap[serial])
      return dbapi.markStartOfDeviceUsage(
        serialLeaseMap[serial],
        message.owner.email,
        device,
        startAt,
        defaultEndsAt
      )
    }).then(function() {
      // update every x minutes
      setTimeout(function() {
        updateDeviceLastSeen(serialLeaseMap[serial], serial)
      }, defaultIntervalMinutes * 60 * 1000)
    })
  })
  .on(wire.LeaveGroupMessage, function(channel, message) {
    var serial = message.serial
    log.info('updateDeviceUsage on LeaveGroupMessage, serial:', serial)
    if (serialLeaseMap[serial]) {
      dbapi.markEndOfDeviceUsage(serialLeaseMap[serial], new Date())
      .then(function() {
        delete serialLeaseMap[serial]
      })
    }
    else {
      log.info('Cannot found previous usage for device serial', serial)
    }
  })
  .handler())

  lifecycle.observe(function() {
    [sub].forEach(function(sock) {
      try {
        sock.close()
      }
      catch (err) {
        // No-op
      }
    })
  })
})
