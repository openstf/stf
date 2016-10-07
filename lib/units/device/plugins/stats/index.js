var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../../util/logger')
var dbapi = require('../../../../db/api')
var uuid = require('node-uuid')

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

module.exports = syrup.serial()
  .dependency(require('../group'))
  .define(function(options, group) {
    var log = logger.createLogger('device:plugins:stats')
    
    group.on('join', function(currentGroup, identifier) {
      dbapi.loadDevice(options.serial)
        .then(function(device) {
          serialLeaseMap[options.serial] = uuid.v4()
          var startAt = new Date()
          var defaultEndsAt = new Date(startAt.getTime() + defaultIntervalMinutes * 60 * 1000)
          log.info('Created new lease id', serialLeaseMap[options.serial])
          dbapi.markStartOfDeviceUsage(
            serialLeaseMap[options.serial],
            currentGroup,
            device,
            startAt,
            defaultEndsAt
          )

          // update every x minutes
          setTimeout(function() {
            updateDeviceLastSeen(serialLeaseMap[options.serial], options.serial)
          }, defaultIntervalMinutes * 60 * 1000)
         })
    })

    group.on('leave', function(currentGroup) {
      log.info('updateDeviceUsage')
      if (serialLeaseMap[options.serial]) {
        dbapi.markEndOfDeviceUsage(serialLeaseMap[options.serial], new Date())
        delete serialLeaseMap[options.serial]
      }
      else {
        log.info('Cannot found previous usage for device serial', options.serial)
      }
    })

    return Promise.resolve()
  })
