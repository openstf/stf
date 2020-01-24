/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

var util = require('util')

var uuid = require('uuid')
var _ = require('lodash')

var dbapi = require('../db/api')
var devices = require('stf-device-db/dist/devices-latest')

module.exports.generate = function(wantedModel) {
  // no base64 because some characters as '=' or '/' are not compatible through API (delete devices)
  const serial = 'fake-' + util.format('%s', uuid.v4()).replace(/-/g, '')

  return dbapi.saveDeviceInitialState(serial, {
      provider: {
        name: 'FAKE/1'
      , channel: '*fake'
      }
    , status: 'OFFLINE'
    })
    .then(function() {
      var model = wantedModel || _.sample(Object.keys(devices))
      return dbapi.saveDeviceIdentity(serial, {
        platform: 'Android'
      , manufacturer: 'Foo Electronics'
      , operator: 'Loss Networks'
      , model: model
      , version: '4.1.2'
      , abi: 'armeabi-v7a'
      , sdk: (8 + Math.floor(Math.random() * 12)).toString() // string required!
      , display: {
          density: 3
        , fps: 60
        , height: 1920
        , id: 0
        , rotation: 0
        , secure: true
        , url: '/404.jpg'
        , width: 1080
        , xdpi: 442
        , ydpi: 439
        }
      , phone: {
          iccid: '1234567890123456789'
        , imei: '123456789012345'
        , imsi: '123456789012345'
        , network: 'LTE'
        , phoneNumber: '0000000000'
        }
      , product: model
      , cpuPlatform: 'msm8996'
      , openGLESVersion: '3.1'
      , marketName: 'Bar F9+'
      })
    })
    .then(function() {
      return dbapi.setDeviceAbsent(serial)
    })
    .return(serial)
}
