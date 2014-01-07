var assert = require('assert')

assert.ok(process.env.ANDROID_SERIAL,
  'Missing environment variable ANDROID_SERIAL')

var log = require('./util/logger')
  .setGlobalIdentifier(process.env.ANDROID_SERIAL)
  .createLogger('device')
