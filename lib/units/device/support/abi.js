var syrup = require('stf-syrup')

var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('./properties'))
  .define(function(options, properties) {
    var log = logger.createLogger('device:support:abi')
    return (function() {
      function split(list) {
        return list ? list.split(',') : []
      }

      var abi = {
        primary: properties['ro.product.cpu.abi']
      , pie: properties['ro.build.version.sdk'] >= 16
      , all: []
      , b32: []
      , b64: []
      }

      // Since Android 5.0
      if (properties['ro.product.cpu.abilist']) {
        abi.all = split(properties['ro.product.cpu.abilist'])
        abi.b64 = split(properties['ro.product.cpu.abilist64'])
        abi.b32 = split(properties['ro.product.cpu.abilist32'])
      }
      // Up to Android 4.4
      else {
        abi.all.push(abi.primary)
        abi.b32.push(abi.primary)
        if (properties['ro.product.cpu.abi2']) {
          abi.all.push(properties['ro.product.cpu.abi2'])
          abi.b32.push(properties['ro.product.cpu.abi2'])
        }
      }

      log.info('Supports ABIs %s', abi.all.join(', '))

      return abi
    })()
  })
