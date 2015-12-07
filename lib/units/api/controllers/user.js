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
, getUserDeviceBySerial: getUserDeviceBySerial
, connectDeviceBySerial: connectDeviceBySerial
, disconnectDeviceBySerial: disconnectDeviceBySerial
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
      res.status(500).json({
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
        if(device.present && device.ready && !device.using && !device.owner) {

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

          res.status(202).json({
            success: true
          , description: 'Device Add request is accepted'
          })

        } else {
          res.status(500).json({
            success: false
          , description: 'Device is being used or not available'
          })
        }
      } else {
        res.status(500).json({
          success: false
        , description: 'Bad device serial'
        })
      }
    })
}

function deleteDeviceFromUser(req, res) {
  var serial = req.swagger.params.serial.value

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

          res.status(202).json({
            success: true
          , description: 'Device Release request is accepted'
          })

        } else {
          res.status(500).json({
            success: false
          , description: 'You cannot kick this device'
          })
        }
      } else {
        res.status(500).json({
          success: false
        , description: 'Bad device serial'
        })
      }
    })
}

function getUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var fields = req.swagger.params.fields.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (device) {
        datautil.normalize(device, req.user)

        if (device.owner && device.owner === req.user.email) {
          if(fields) {
            device = _.pick(device, fields.split(','))
          }

          res.json({
            success: true
            , device: device
          })
        }
        else {
          res.status(404).json({
            success: false
          , description: 'device is not owned by you'
          })
        }
      }
      else {
        res.status(404).json({
          success: false
        })
      }
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function connectDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (device) {
        datautil.normalize(device, req.user)

        if (device.present && device.ready && device.using && device.owner.email == req.user.email) {
          req.options.push.send([
            device.channel
          , wireutil.envelope(
              new wire.ConnectStartMessage()
            )
          ])

          res.status(202).json({
            success: true
          , description: 'Device Connect request is accepted'
          })
        }
        else {
          res.status(500).json({
            success: false
          , description: 'Device is not owned by you or is not available'
          })
        }
      }
      else {
        res.status(404).json({
          success: false
        , description: 'Bad device serial'
        })
      }
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function disconnectDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (device) {
        datautil.normalize(device, req.user)

        if (device.present && device.ready && device.using && device.owner.email == req.user.email) {
          req.options.push.send([
            device.channel
          , wireutil.envelope(
              new wire.ConnectStopMessage()
          )
          ])

          res.status(202).json({
            success: true
          , description: 'Device Disonnect request is accepted'
          })
        }
        else {
          res.status(500).json({
            success: false
          , description: 'Device is not owned by you or is not available'
          })
        }
      }
      else {
        res.status(404).json({
          success: false
        , description: 'Bad device serial'
        })
      }
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}
