var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')

var log = logger.createLogger('api:controllers:device')

module.exports = {
  getDevices: getDevices
, getDeviceBySerial: getDeviceBySerial
}

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
