var r = require('rethinkdb')

var db = require('./')
var wireutil = require('../wire/util')

var dbapi = Object.create(null)

dbapi.close = function(options) {
  return db.close(options)
}

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

dbapi.loadGroup = function(email) {
  return db.run(r.table('devices').getAll(email, {
    index: 'ownerEmail'
  }))
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
  var data = {
    present: true
  , provider: device.provider
  , owner: null
  , status: device.status
  , ready: false
  , statusChangedAt: r.now()
  , createdAt: r.now()
  , lastHeartbeatAt: r.now()
  }
  return db.run(r.table('devices').get(serial).update(data))
    .then(function(stats) {
      if (stats.skipped) {
        data.serial = serial
        return db.run(r.table('devices').insert(data))
      }
      return stats
    })
}

dbapi.saveDeviceStatus = function(serial, status) {
  return db.run(r.table('devices').get(serial).update({
    status: status
  , statusChangedAt: r.now()
  }))
}

dbapi.setDeviceOwner = function(serial, owner) {
  return db.run(r.table('devices').get(serial).update({
    owner: owner
  }))
}

dbapi.unsetDeviceOwner = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    owner: null
  }))
}

dbapi.setDeviceAbsent = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    present: false
  , ready: false
  , lastHeartbeatAt: null
  }))
}

dbapi.setDeviceChannel = function(serial, channel) {
  return db.run(r.table('devices').get(serial).update({
    channel: channel
  }))
}

dbapi.saveDeviceIdentity = function(serial, identity) {
  return db.run(r.table('devices').get(serial).update({
    ready: true
  , platform: identity.platform
  , manufacturer: identity.manufacturer
  , operator: identity.operator
  , model: identity.model
  , version: identity.version
  , abi: identity.abi
  , sdk: identity.sdk
  , display: identity.display
  , browsers: identity.browsers
  , phone: identity.phone
  }))
}

dbapi.loadDevices = function() {
  return db.run(r.table('devices'))
}

dbapi.loadDevice = function(serial) {
  return db.run(r.table('devices').get(serial))
}

dbapi.updateDeviceHeartbeat = function(serial) {
  return db.run(
    r.table('devices').get(serial).update({
      lastHeartbeatAt: r.now()
    })
  , {
      noreply: true
    , durability: 'soft'
    }
  )
}

dbapi.getDeadDevices = function(timeout) {
  return db.run(
    r.table('devices')
      .between(null, r.now().sub(timeout / 1000), {
        index: 'lastHeartbeatAt'
      })
      .pluck('serial')
  )
}

module.exports = dbapi
