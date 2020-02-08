/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const apiutil = require('./apiutil')
const dbapi = require('../db/api')

const lockutil = Object.create(null)

lockutil.unlockDevice = function(lock) {
  if (lock.device) {
    dbapi.unlockDevice(lock.device.serial)
  }
}

lockutil.lockUser = function(email, res, lock) {
  return dbapi.lockUser(email)
    .then(function(stats) {
      return apiutil.computeStats(res, stats, 'user', lock)
    })
}

lockutil.unlockUser = function(lock) {
  if (lock.user) {
    dbapi.unlockUser(lock.user.email)
  }
}

lockutil.lockGroupAndUser = function(req, res, lock) {
  return lockutil.lockGroup(req, res, lock).then(function(lockingSuccessed) {
    return lockingSuccessed ?
      lockutil.lockUser(req.user.email, res, lock) :
      false
  })
}

lockutil.unlockGroupAndUser = function(lock) {
  lockutil.unlockGroup(lock)
  lockutil.unlockUser(lock)
}

lockutil.lockGroup = function(req, res, lock) {
  const id = req.swagger.params.id.value
  const email = req.user.email

  return dbapi.lockGroupByOwner(email, id).then(function(stats) {
    return apiutil.computeStats(res, stats, 'group', lock)
  })
}

lockutil.unlockGroup = function(lock) {
  if (lock.group) {
    dbapi.unlockGroup(lock.group.id)
  }
}

lockutil.unlockGroupAndDevice = function(lock) {
  lockutil.unlockGroup(lock)
  lockutil.unlockDevice(lock)
}

lockutil.lockGenericDevice = function(req, res, lock, lockDevice) {
  return lockDevice(req.user.groups.subscribed, req.swagger.params.serial.value)
    .then(function(stats) {
      return apiutil.computeStats(res, stats, 'device', lock)
    })
}

module.exports = lockutil
