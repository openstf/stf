var Promise = require('bluebird')
var _ = require('lodash')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')

var log = logger.createLogger('api:controllers:device')

module.exports = {
  getDevices: getDevices
, getDeviceBySerial: getDeviceBySerial
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
      if (device) {
        datautil.normalize(device, req.user)

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
