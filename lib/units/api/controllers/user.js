var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

var log = logger.createLogger('api:controllers:user')

module.exports = {
  getCurrentUser: getCurrentUser
, getCurrentUserDevices: getCurrentUserDevices
, addDeviceToUser: addDeviceToUser
, deleteDeviceFromUser: deleteDeviceFromUser
}

function getCurrentUser(req, res) {
  res.json({
    success: true
  , user: req.user
  })
}

function getCurrentUserDevices(req, res) {
  dbapi.loadUserDevices(req.user.email)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          list.forEach(function(device) {
            datautil.normalize(device, req.user)
          })
          res.json({
            success: true
          , devices: list
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load group: ', err.stack)
      res.json(500, {
        success: false
      })
    })
}

function addDeviceToUser(req, res) {
  var serial = req.body.serial
  var timeout = req.body.timeout || null

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (device) {
        datautil.normalize(device, req.user)
        if(device.ready && !device.using) {

          var requirements = {
            'serial': {
              'value': serial,
              'match': 'exact'
            }
          }

          req.options.push.send([
            device.channel
          , wireutil.envelope(
              new wire.GroupMessage(
                new wire.OwnerMessage(
                  req.user.email
                , req.user.name
                , req.user.group
                )
              , timeout
              , wireutil.toDeviceRequirements(requirements)
              )
            )
          ])

          res.json(202, {
            success: true
          , description: 'Device Add request is accepted'
          })

        } else {
          res.json(500, {
            success: false
          , description: 'Device is being used or not available'
          })
        }
      } else {
        res.json(500, {
          success: false
        , description: 'Bad device serial'
        })
      }
    })
}

function deleteDeviceFromUser(req, res) {
  var serial = req.body.serial

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (device) {
        datautil.normalize(device, req.user)
        if(device.using && device.owner.email == req.user.email) {

          var requirements = {
            'serial': {
              'value': serial,
              'match': 'exact'
            }
          }

          req.options.push.send([
            device.channel
          , wireutil.envelope(
              new wire.UngroupMessage(
                wireutil.toDeviceRequirements(requirements)
              )
            )
          ])

          res.json(202, {
            success: true
          , description: 'Device Release request is accepted'
          })

        } else {
          res.json(500, {
            success: false
          , description: 'You cannot kick this device'
          })
        }
      } else {
        res.json(500, {
          success: false
        , description: 'Bad device serial'
        })
      }
    })
}
