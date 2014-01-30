var r = require('rethinkdb')

var db = require('./')

module.exports.saveUserAfterLogin = function(user) {
  return db.run(r.table('users').insert({
      email: user.email
    , name: user.name
    , lastLogin: r.now()
    }
  , {
      upsert: true
    }))
}

module.exports.saveDeviceLog = function(serial, entry) {
  return db.run(r.table('logs').insert({
    serial: entry.serial
  , timestamp: r.epochTime(entry.timestamp)
  , priority: entry.priority
  , tag: entry.tag
  , pid: entry.pid
  , message: entry.message
  }))
}

module.exports.saveDeviceStatus = function(serial, status) {
  return db.run(r.table('devices').get(serial).update({
      status: status.status
    , provider: status.provider
    , statusChangedAt: r.now()
    }))
    .then(function(stats) {
      if (stats.skipped) {
        return db.run(r.table('devices').insert({
          serial: serial
        , provider: status.provider
        , status: status.status
        , statusChangedAt: r.now()
        , createdAt: r.now()
        }))
      }
      return stats
    })
}

module.exports.saveDeviceIdentity = function(serial, identity) {
  return db.run(r.table('devices').get(serial).update({
    platform: identity.platform
  , manufacturer: identity.manufacturer
  , model: identity.model
  , version: identity.version
  , abi: identity.abi
  , sdk: identity.sdk
  , display: identity.display
  }))
}
