/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

var _ = require('lodash')
var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var log = logger.createLogger('api:controllers:devices')

const apiutil = require('../../../util/apiutil')
const lockutil = require('../../../util/lockutil')
const util = require('util')
const uuid = require('uuid')
const wire = require('../../../wire')
const wireutil = require('../../../wire/util')
const wirerouter = require('../../../wire/router')

/* ------------------------------------ PRIVATE FUNCTIONS ------------------------------- */

function filterGenericDevices(req, res, devices) {
  apiutil.respond(res, 200, 'Devices Information', {
    devices: devices.map(function(device) {
      return apiutil.filterDevice(req, device)
    })
  })
}

function getGenericDevices(req, res, loadDevices) {
  loadDevices(req.user.groups.subscribed).then(function(devices) {
    filterGenericDevices(req, res, devices)
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to load device list: ', err.stack)
  })
}

function getDeviceFilteredGroups(serial, fields, bookingOnly) {
  return dbapi.getDeviceGroups(serial).then(function(groups) {
    return Promise.map(groups, function(group) {
      return !bookingOnly || !apiutil.isOriginGroup(group.class) ?
        group :
        'filtered'
    })
    .then(function(groups) {
      return _.without(groups, 'filtered').map(function(group) {
        if (fields) {
          return _.pick(apiutil.publishGroup(group), fields.split(','))
        }
        return apiutil.publishGroup(group)
      })
    })
  })
}

function extractStandardizableDevices(devices) {
  return dbapi.getTransientGroups().then(function(groups) {
    return Promise.map(devices, function(device) {
      return Promise.map(groups, function(group) {
        if (group.devices.indexOf(device.serial) > -1) {
          return Promise.reject('booked')
        }
        return true
      })
      .then(function() {
        return device
      })
      .catch(function(err) {
         if (err !== 'booked') {
          throw err
        }
        return err
      })
    })
    .then(function(devices) {
      return _.without(devices, 'booked')
    })
  })
}

function getStandardizableDevices(req, res) {
  dbapi.loadDevicesByOrigin(req.user.groups.subscribed).then(function(devices) {
    extractStandardizableDevices(devices).then(function(devices) {
      filterGenericDevices(req, res, devices)
    })
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to load device list: ', err.stack)
  })
}

function removeDevice(serial, req, res) {
  const presentState = req.swagger.params.present.value
  const bookingState = req.swagger.params.booked.value
  const notesState = req.swagger.params.annotated.value
  const controllingState = req.swagger.params.controlled.value
  const anyPresentState = typeof presentState === 'undefined'
  const anyBookingState = typeof bookingState === 'undefined'
  const anyNotesState = typeof notesState === 'undefined'
  const anyControllingState = typeof controllingState === 'undefined'
  const lock = {}

  function deleteGroupDevice(email, id) {
    const lock = {}

    return dbapi.lockGroupByOwner(email, id).then(function(stats) {
      if (!stats.replaced) {
        return apiutil.lightComputeStats(res, stats)
      }
      const group = lock.group = stats.changes[0].new_val

      if (group.devices.indexOf(serial) > -1) {
        return apiutil.isOriginGroup(group.class) ?
          dbapi.removeOriginGroupDevice(group, serial) :
          dbapi.removeGroupDevices(group, [serial])
      }
      return group
    })
    .finally(function() {
      lockutil.unlockGroup(lock)
    })
  }

  function deleteDeviceInDatabase() {
    function wrappedDeleteDeviceInDatabase() {
      const result = {
        status: false
      , data: 'not deleted'
      }

      return dbapi.loadDeviceBySerial(serial).then(function(device) {
        if (device && device.group.id === device.group.origin) {
          return deleteGroupDevice(device.group.owner.email, device.group.id)
            .then(function(group) {
              if (group !== 'not found') {
                return dbapi.deleteDevice(serial).then(function() {
                  result.status = true
                  result.data = 'deleted'
                })
              }
              return false
            })
        }
        return false
      })
      .then(function() {
        return result
      })
    }
    return apiutil.setIntervalWrapper(
      wrappedDeleteDeviceInDatabase
    , 10
    , Math.random() * 500 + 50)
  }

  return dbapi.lockDeviceByOrigin(req.user.groups.subscribed, serial).then(function(stats) {
    if (!stats.replaced) {
      return apiutil.lightComputeStats(res, stats)
    }
    const device = lock.device = stats.changes[0].new_val

    if (!anyPresentState && device.present !== presentState ||
      !anyControllingState && (device.owner === null) === controllingState ||
      !anyNotesState &&
        (typeof device.notes !== 'undefined' && device.notes !== '') !== notesState ||
      !anyBookingState && (device.group.id !== device.group.origin && !bookingState ||
                           device.group.class === apiutil.STANDARD && bookingState)) {
      return 'unchanged'
    }
    if (device.group.class === apiutil.STANDARD) {
      return deleteDeviceInDatabase()
    }
    return dbapi.getDeviceTransientGroups(serial).then(function(groups) {
      if (groups.length && !anyBookingState && !bookingState) {
        return 'unchanged'
      }
      return Promise.each(groups, function(group) {
        return deleteGroupDevice(group.owner.email, group.id)
      })
      .then(function() {
        if (!groups.length && !anyBookingState && bookingState) {
          return 'unchanged'
        }
        return deleteDeviceInDatabase()
      })
    })
  })
  .finally(function() {
    lockutil.unlockDevice(lock)
  })
}

/* ------------------------------------ PUBLIC FUNCTIONS ------------------------------- */

function getDevices(req, res) {
  const target = req.swagger.params.target.value

  switch(target) {
    case apiutil.BOOKABLE:
      getGenericDevices(req, res, dbapi.loadBookableDevices)
      break
    case apiutil.ORIGIN:
      getGenericDevices(req, res, dbapi.loadDevicesByOrigin)
      break
    case apiutil.STANDARD:
      getGenericDevices(req, res, dbapi.loadStandardDevices)
      break
    case apiutil.STANDARDIZABLE:
      getStandardizableDevices(req, res)
      break
    default:
      getGenericDevices(req, res, dbapi.loadDevices)
  }
}

function getDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var fields = req.swagger.params.fields.value

  dbapi.loadDevice(req.user.groups.subscribed, serial)
    .then(function(cursor) {
      cursor.next(function(err, device) {
        if (err) {
          return res.status(404).json({
            success: false
          , description: 'Device not found'
          })
        }
        let responseDevice = apiutil.publishDevice(device, req.user)

        if (fields) {
          responseDevice = _.pick(device, fields.split(','))
        }
        res.json({
          success: true
        , device: responseDevice
        })
      })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getDeviceGroups(req, res) {
  const serial = req.swagger.params.serial.value
  const fields = req.swagger.params.fields.value

  dbapi.loadDevice(req.user.groups.subscribed, serial).then(function(cursor) {
    return cursor.toArray()
  })
  .then(function(devices) {
    if (!devices.length) {
      apiutil.respond(res, 404, 'Not Found (device)')
    }
    else {
      getDeviceFilteredGroups(serial, fields, false)
        .then(function(groups) {
          return apiutil.respond(res, 200, 'Groups Information', {groups: groups})
        })
    }
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to get device groups: ', err.stack)
  })
}

function getDeviceBookings(req, res) {
  const serial = req.swagger.params.serial.value
  const fields = req.swagger.params.fields.value

  dbapi.loadDevice(req.user.groups.subscribed, serial).then(function(cursor) {
    return cursor.toArray()
  })
  .then(function(devices) {
    if (!devices.length) {
      apiutil.respond(res, 404, 'Not Found (device)')
    }
    else {
      getDeviceFilteredGroups(serial, fields, true)
        .then(function(bookings) {
          apiutil.respond(res, 200, 'Bookings Information', {bookings: bookings})
        })
    }
  })
  .catch(function(err) {
    apiutil.internalError(res, 'Failed to get device bookings: ', err.stack)
  })
}

function addOriginGroupDevices(req, res) {
  const serials = apiutil.getBodyParameter(req.body, 'serials')
  const fields = apiutil.getQueryParameter(req.swagger.params.fields)
  const target = apiutil.getQueryParameter(req.swagger.params.redirected) ? 'device' : 'devices'
  const lock = {}

  function askUpdateDeviceOriginGroup(group, serial) {
    return new Promise(function(resolve, reject) {
      const signature = util.format('%s', uuid.v4()).replace(/-/g, '')
      let messageListener
      const responseTimer = setTimeout(function() {
        req.options.channelRouter.removeListener(wireutil.global, messageListener)
        apiutil.respond(res, 504, 'Gateway Time-out')
        reject('timeout')
      }, 5000)

      messageListener = wirerouter()
        .on(wire.DeviceOriginGroupMessage, function(channel, message) {
          if (message.signature === signature) {
            clearTimeout(responseTimer)
            req.options.channelRouter.removeListener(wireutil.global, messageListener)
            dbapi.loadDeviceBySerial(serial).then(function(device) {
              if (fields) {
                resolve(_.pick(apiutil.publishDevice(device, req.user), fields.split(',')))
              }
              else {
                resolve(apiutil.publishDevice(device, req.user))
              }
            })
          }
        })
        .handler()

      req.options.channelRouter.on(wireutil.global, messageListener)
      return dbapi.askUpdateDeviceOriginGroup(serial, group, signature)
    })
  }

  function updateDeviceOriginGroup(group, serial) {
    const lock = {}

    return dbapi.lockDeviceByOrigin(req.user.groups.subscribed, serial).then(function(stats) {
      if (!stats.replaced) {
        return apiutil.lightComputeStats(res, stats)
      }
      lock.device = stats.changes[0].new_val

      return dbapi.isUpdateDeviceOriginGroupAllowed(serial, group)
        .then(function(updatingAllowed) {
          if (!updatingAllowed) {
            apiutil.respond(res, 403, 'Forbidden (device is currently booked)')
            return Promise.reject('booked')
          }
          return askUpdateDeviceOriginGroup(group, serial)
        })
    })
    .finally(function() {
      lockutil.unlockDevice(lock)
    })
  }

  function updateDevicesOriginGroup(group, serials) {
    let results = []

    return Promise.each(serials, function(serial) {
      return updateDeviceOriginGroup(group, serial).then(function(result) {
        results.push(result)
      })
    })
    .then(function() {
      const result = target === 'device' ? {device: {}} : {devices: []}

      results = _.without(results, 'unchanged')
      if (!results.length) {
        return apiutil.respond(res, 200, `Unchanged (${target})`, result)
      }
      results = _.without(results, 'not found')
      if (!results.length) {
        return apiutil.respond(res, 404, `Not Found (${target})`)
      }
      if (target === 'device') {
        result.device = results[0]
      }
      else {
        result.devices = results
      }
      return apiutil.respond(res, 200, `Updated (${target})`, result)
    })
    .catch(function(err) {
      if (err !== 'booked' && err !== 'timeout' && err !== 'busy') {
        throw err
      }
    })
  }

  return lockutil.lockGroup(req, res, lock).then(function(lockingSuccessed) {
    if (lockingSuccessed) {
      const group = lock.group

      if (!apiutil.isOriginGroup(group.class)) {
        return apiutil.respond(res, 400, 'Bad Request (this group cannot act as an origin one)')
      }
      if (typeof serials !== 'undefined') {
        return updateDevicesOriginGroup(
          group
        , _.without(serials.split(','), '').filter(function(serial) {
            return group.devices.indexOf(serial) < 0
          })
        )
      }
      return dbapi.loadDevicesByOrigin(req.user.groups.subscribed).then(function(devices) {
        if (group.class === apiutil.BOOKABLE) {
          return devices
        }
        return extractStandardizableDevices(devices)
      })
      .then(function(devices) {
        const serials = []

        devices.forEach(function(device) {
          if (group.devices.indexOf(device.serial) < 0) {
            serials.push(device.serial)
          }
        })
        return updateDevicesOriginGroup(group, serials)
      })
    }
    return false
  })
  .catch(function(err) {
    apiutil.internalError(res, `Failed to update ${target} origin group: `, err.stack)
  })
  .finally(function() {
    lockutil.unlockGroup(lock)
  })
}

function addOriginGroupDevice(req, res) {
  apiutil.redirectApiWrapper('serial', addOriginGroupDevices, req, res)
}

function removeOriginGroupDevices(req, res) {
  const lock = {}

  return lockutil.lockGroup(req, res, lock).then(function(lockingSuccessed) {
    if (lockingSuccessed) {
      const group = lock.group

      if (!apiutil.checkBodyParameter(req.body, 'serials')) {
        req.body = {serials: group.devices.join()}
      }
      return dbapi.getRootGroup().then(function(group) {
        req.swagger.params.id = {value: group.id}
        return addOriginGroupDevices(req, res)
      })
    }
    return false
  })
  .finally(function() {
    lockutil.unlockGroup(lock)
  })
}

function removeOriginGroupDevice(req, res) {
  apiutil.redirectApiWrapper('serial', removeOriginGroupDevices, req, res)
}

function deleteDevices(req, res) {
  const serials = apiutil.getBodyParameter(req.body, 'serials')
  const target = apiutil.getQueryParameter(req.swagger.params.redirected) ? 'device' : 'devices'

  function removeDevices(serials) {
    let results = []

    return Promise.each(serials, function(serial) {
      return removeDevice(serial, req, res).then(function(result) {
        if (result === 'not deleted') {
          apiutil.respond(res, 503, 'Server too busy [code: 2], please try again later')
          return Promise.reject('busy')
        }
        return results.push(result)
      })
    })
    .then(function() {
      results = _.without(results, 'unchanged')
      if (!results.length) {
        return apiutil.respond(res, 200, `Unchanged (${target})`)
      }
      if (!_.without(results, 'not found').length) {
        return apiutil.respond(res, 404, `Not Found (${target})`)
      }
      return apiutil.respond(res, 200, `Deleted (${target})`)
    })
    .catch(function(err) {
      if (err !== 'busy') {
        throw err
      }
    })
  }

  (function() {
    if (typeof serials === 'undefined') {
      return dbapi.loadDevicesByOrigin(req.user.groups.subscribed).then(function(devices) {
        return removeDevices(devices.map(function(device) {
          return device.serial
        }))
      })
    }
    else {
      return removeDevices(_.without(serials.split(','), ''))
    }
  })()
  .catch(function(err) {
    apiutil.internalError(res, `Failed to delete ${target}: `, err.stack)
  })
}

function deleteDevice(req, res) {
  apiutil.redirectApiWrapper('serial', deleteDevices, req, res)
}

module.exports = {
  getDevices: getDevices
, getDeviceBySerial: getDeviceBySerial
, getDeviceGroups: getDeviceGroups
, getDeviceBookings: getDeviceBookings
, addOriginGroupDevice: addOriginGroupDevice
, addOriginGroupDevices: addOriginGroupDevices
, removeOriginGroupDevice: removeOriginGroupDevice
, removeOriginGroupDevices: removeOriginGroupDevices
, deleteDevice: deleteDevice
, deleteDevices: deleteDevices
}
