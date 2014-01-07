var adb = require('adbkit')
var async = require('async')

var log = require('./util/logger').createLogger('provider')
var client = adb.createClient()

client.trackDevices(function(err, tracker) {
  if (err) {
    log.fatal('Unable to track devices: %s', err.message)
    throw err
  }

  log.info('Tracking devices')

  tracker.on('add', function(device) {
    log.info('Found device "%s" (%s)', device.id, device.type)
  })

  tracker.on('change', function(device) {
    log.info('Device "%s" is now "%s"', device.id, device.type)
  })

  tracker.on('remove', function(device) {
    log.info('Lost device "%s" (%s)', device.id, device.type)
  })
})
