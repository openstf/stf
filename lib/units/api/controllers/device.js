var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')

var log = logger.createLogger('api:controllers:device')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = {
  getDevices: getDevices
, getDeviceBySerial: getDeviceBySerial
, reserveDeviceBySerial: reserveDeviceBySerial
, releaseDeviceBySerial: releaseDeviceBySerial
}

var log = logger.createLogger('api:contoller:device')

function getDevices(req, res) {
  dbapi.loadDevices()
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
      log.error('Failed to load device list: ', err.stack)
      res.json(500, {
        success: false
      })
    })
}

function getDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (device) {
        datautil.normalize(device, req.user)
        res.json({
          success: true
        , device: device
        })
      }
      else {
        res.json(404, {
          success: false
        })
      }
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.json(500, {
        success: false
      })
    })
}

function reserveDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (device) {
        datautil.normalize(device, req.user)
        if(!device.using) {

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
              , null
              , wireutil.toDeviceRequirements(requirements)
              )
            )
          ])

          res.json({
            success: true
          , device: device
          })

        } else {
          res.json(500, {
            success: false
          , description: 'Device is being used'
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

function releaseDeviceBySerial(req, res) {
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

          res.json({
            success: true
          , device: device
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
