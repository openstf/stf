var util = require('util')

var uuid = require('node-uuid')
var _ = require('lodash')

var dbapi = require('../db/api')
var devices = require('stf-device-db')

module.exports.generate = function() {
  var serial = util.format(
    'fake-%s'
  , uuid.v4(null, new Buffer(16)).toString('base64')
  )

  return dbapi.saveDevice(serial, {
      provider: {
        name: 'FAKE/1'
      , channel: '*fake'
      }
    , status: 'OFFLINE'
    })
    .then(function() {
      return dbapi.saveDeviceIdentity(serial, {
        platform: 'Android'
      , manufacturer: 'Foo Electronics'
      , operator: 'Loss Networks'
      , model: _.sample(Object.keys(devices))
      , version: '4.1.2'
      , abi: 'armeabi-v7a'
      , sdk: 8 + Math.floor(Math.random() * 12)
      , display: {
          density: 3
        , fps: 60
        , height: 1920
        , id: 0
        , orientation: 0
        , secure: true
        , url: '/404.jpg'
        , width: 1080
        , xdpi: 442
        , ydpi: 439
        }
      , phone: {
          iccid: '1234567890123456789'
        , imei: '123456789012345'
        , network: 'LTE'
        , phoneNumber: '0000000000'
        }
      })
    })
    .then(function() {
      return dbapi.setDeviceAbsent(serial)
    })
    .return(serial)
}
