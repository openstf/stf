var r = require('rethinkdb')
var Promise = require('bluebird')

var db = require('./')
var wire = require('../wire')
var wireutil = require('../wire/util')

var dbapi = Object.create(null)

dbapi.saveUserAfterLogin = function(user) {
  return db.run(r.table('users').get(user.email).update({
      name: user.name
    , lastLoggedInAt: r.now()
    }))
    .then(function(stats) {
      if (stats.skipped) {
        return db.run(r.table('users').insert({
          email: user.email
        , name: user.name
        , group: wireutil.makePrivateChannel()
        , lastLoggedInAt: r.now()
        , createdAt: r.now()
        }))
      }
      return stats
    })
}

dbapi.loadUser = function(email) {
  return db.run(r.table('users').get(email))
}

dbapi.saveDeviceLog = function(serial, entry) {
  return db.run(r.table('logs').insert({
    serial: entry.serial
  , timestamp: r.epochTime(entry.timestamp)
  , priority: entry.priority
  , tag: entry.tag
  , pid: entry.pid
  , message: entry.message
  }))
}

dbapi.saveDevice = function(serial, device) {
  return db.run(r.table('devices').insert({
      serial: serial
    , present: true
    , provider: device.provider
    , owner: null
    , status: device.status
    , statusChangedAt: r.now()
    , createdAt: r.now()
    }
  , {
      upsert: true
    }))
}

dbapi.saveDeviceStatus = function(serial, status) {
  return dbapi.ensureDeviceSaved(serial)
    .then(function() {
      return db.run(r.table('devices').get(serial).update({
        status: status
      , statusChangedAt: r.now()
      }))
    })
}

dbapi.setDeviceOwner = function(serial, owner) {
  return db.run(r.table('devices').get(serial).update({
    owner: owner
  }))
}

dbapi.unsetDeviceOwner = function(serial, owner) {
  return db.run(r.table('devices').get(serial).update({
    owner: null
  }))
}

dbapi.setDeviceAbsent = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    present: false
  }))
}

dbapi.saveDeviceIdentity = function(serial, identity) {
  return db.run(r.table('devices').get(serial).update({
    platform: identity.platform
  , manufacturer: identity.manufacturer
  , operator: identity.operator
  , model: identity.model
  , version: identity.version
  , abi: identity.abi
  , sdk: identity.sdk
  , display: identity.display
  }))
}

dbapi.loadDevices = function() {
  return db.run(r.table('devices'))
}

dbapi.loadDevice = function(serial) {
  return db.run(r.table('devices').get(serial))
}

dbapi.ensureDeviceSaved = function(serial) {
  return dbapi.loadDevice(serial)
    .then(function(device) {
      if (!device) {
        return Promise.delay(100).then(function() {
          return dbapi.loadDevice(serial)
        })
      }
      return device
    })
}

module.exports = dbapi
