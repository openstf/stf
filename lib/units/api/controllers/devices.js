var _ = require('lodash')
var Promise = require('bluebird')
var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')
var log = logger.createLogger('api:controllers:devices')

var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var wirerouter = require('../../../wire/router')

module.exports = {
  getDevices: getDevices
 ,getDeviceBySerial: getDeviceBySerial
 ,wipeoutDeviceBySerial:wipeoutDeviceBySerial
  ,
}

function getDevices(req, res) {
  var fields = req.swagger.params.fields.value

  dbapi.loadDevices()
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          var deviceList = []

          list.forEach(function(device) {
            datautil.normalize(device, req.user)
            var responseDevice = device

            if (fields) {
              responseDevice = _.pick(device, fields.split(','))
            }
            deviceList.push(responseDevice)
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

function getDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var fields = req.swagger.params.fields.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (!device) {
        return res.status(404).json({
          success: false
        , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      var responseDevice = device

      if (fields) {
        responseDevice = _.pick(device, fields.split(','))
      }

      res.json({
        success: true
      , device: responseDevice
      })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function wipeoutDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var fields = req.swagger.params.fields.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (!device) {
        return res.status(404).json({
          success: false
          , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)

      log.important(device.channel)

      var responseTimer = setTimeout(function() {
        req.options.channelRouter.removeListener(wireutil.global, messageListener)
        return res.status(504).json({
          success: false
          , description: 'Device is not responding'
        })
      }, 5000)

      var messageListener = wirerouter().on(wire.JoinGroupMessage, function(channel, message) {
        if (message.serial === serial && message.owner.email === req.user.email) {
          clearTimeout(responseTimer)
          req.options.channelRouter.removeListener(wireutil.global, messageListener)

          return res.json({
            success: true
            , description: 'Device is now being erased'
          })
        }
      })
        .handler()

      req.options.channelRouter.on(wireutil.global, messageListener)
      req.options.push.send([device.channel, wireutil.envelope(new wire.WipeOutMessage())])

      // if (fields) {
      //   responseDevice = _.pick(device, fields.split(','))
      // }

      // res.json({
      //   success: true
      //   , device: responseDevice
      // })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}
