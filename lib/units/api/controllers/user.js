var util = require('util')

var Promise = require('bluebird')
var _ = require('lodash')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

var log = logger.createLogger('api:controllers:user')

module.exports = {
  getUser: getUser
, getUserDevices: getUserDevices
, addUserDevice: addUserDevice
, getUserDeviceBySerial: getUserDeviceBySerial
, deleteUserDeviceBySerial: deleteUserDeviceBySerial
, remoteConnectUserDeviceBySerial: remoteConnectUserDeviceBySerial
, remoteDisconnectUserDeviceBySerial: remoteDisconnectUserDeviceBySerial
, getUserAccessTokens: getUserAccessTokens
}

function getUser(req, res) {
  res.json({
    success: true
  , user: req.user
  })
}

function getUserDevices(req, res) {
  var fields = req.swagger.params.fields.value

  dbapi.loadUserDevices(req.user.email)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          var deviceList = []

          list.forEach(function(device) {
            datautil.normalize(device, req.user)
            if (fields) {
              device = _.pick(device, fields.split(','))
            }
            deviceList.push(device)
          })

          res.json({
            success: true
          , devices: deviceList
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load device list: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var fields = req.swagger.params.fields.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (device) {
        datautil.normalize(device, req.user)

        if (device.owner && device.owner.email === req.user.email) {
          if(fields) {
            device = _.pick(device, fields.split(','))
          }

          res.json({
            success: true
          , device: device
          })
        }
        else {
          res.status(401).json({
            success: false
          , description: 'Device is not owned by you'
          })
        }
      }
      else {
        res.status(404).json({
          success: false
        , description: 'Device not found'
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

function addUserDevice(req, res) {
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
          , description: 'Device Add request is accepted. Check if device is successfully added using pollingUrl'
          , pollingUrl: util.format('%s://%s%s/user/devices/%s'
                                      , req.protocol
                                      , req.get('host')
                                      , req.swagger.operation.api.basePath
                                      , serial
                                    )
          })

        } else {
          res.status(401).json({
            success: false
          , description: 'Device is being used or not available'
          })
        }
      } else {
        res.status(404).json({
          success: false
        , description: 'Bad device serial'
        })
      }
    })
}

function deleteUserDeviceBySerial(req, res) {
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
          , description: 'Device Release request is accepted. Check if device is successfully removed using pollingUrl'
          , pollingUrl: util.format('%s://%s%s/user/devices/%s'
                                      , req.protocol
                                      , req.get('host')
                                      , req.swagger.operation.api.basePath
                                      , serial
                                    )
          })

        } else {
          res.status(401).json({
            success: false
          , description: 'You cannot kick this device'
          })
        }
      } else {
        res.status(404).json({
          success: false
        , description: 'Bad device serial'
        })
      }
    })
}

function remoteConnectUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (device) {
        datautil.normalize(device, req.user)

        if (device.present && device.ready && device.using && device.owner.email === req.user.email) {
          req.options.push.send([
            device.channel
          , wireutil.envelope(
              new wire.ConnectStartMessage()
            )
          ])

          res.status(202).json({
            success: true
          , description: 'Device Connect request is accepted. Check if device is successfully connected using pollingUrl'
          , pollingUrl: util.format('%s://%s%s/user/devices/%s'
                                      , req.protocol
                                      , req.get('host')
                                      , req.swagger.operation.api.basePath
                                      , serial
                                    )
          })
        }
        else {
          res.status(401).json({
            success: false
          , description: 'Device is not owned by you or is not available'
          })
        }
      }
      else {
        res.status(404).json({
          success: false
        , description: 'Device not found'
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

function remoteDisconnectUserDeviceBySerial(req, res) {
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
          , description: 'Device Disonnect request is accepted. Check if device is successfully disconnected using pollingUrl'
          , pollingUrl: util.format('%s://%s%s/user/devices/%s'
                                      , req.protocol
                                      , req.get('host')
                                      , req.swagger.operation.api.basePath
                                      , serial
                                    )
          })
        }
        else {
          res.status(401).json({
            success: false
          , description: 'Device is not owned by you or is not available'
          })
        }
      }
      else {
        res.status(404).json({
          success: false
        , description: 'Device not found'
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

function getUserAccessTokens(req, res) {
  dbapi.loadAccessTokens(req.user.email)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          var titles = []
          list.forEach(function(token) {
            titles.push(token.title)
          })
          res.json({
            success: true
          , titles: titles
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load tokens: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}
