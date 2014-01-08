var assert = require('assert')

var Promise = require('bluebird')

var logger = require('./util/logger')
var log = logger.createLogger('device')

function readSerialNumber() {
  return Promise.try(function() {
    assert.ok(process.env.ANDROID_SERIAL,
      'Missing environment variable ANDROID_SERIAL')
    return process.env.ANDROID_SERIAL
  })
}

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

Promise.spawn(function* () {
  var serial = yield readSerialNumber()

  // Show serial number in logs
  logger.setGlobalIdentifier(serial)

  // Report
  log.info('Started')
})
