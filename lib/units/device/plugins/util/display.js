var util = require('util')

var syrup = require('stf-syrup')
var EventEmitter = require('eventemitter3').EventEmitter

var logger = require('../../../../util/logger')
var streamutil = require('../../../../util/streamutil')

module.exports = syrup.serial()
  .dependency(require('../../support/adb'))
  .dependency(require('../../resources/minicap'))
  .dependency(require('../service'))
  .dependency(require('../screen/options'))
  .define(function(options, adb, minicap, service, screenOptions) {
    var log = logger.createLogger('device:plugins:display')

    function Display(id, properties) {
      this.id = id
      this.properties = properties
    }

    util.inherits(Display, EventEmitter)

    Display.prototype.updateRotation = function(newRotation) {
      log.info('Rotation changed to %d', newRotation)
      this.properties.rotation = newRotation
      this.emit('rotationChange', newRotation)
    }

    function infoFromMinicap(id) {
      return minicap.run(util.format('-d %d -i', id))
        .then(streamutil.readAll)
        .then(function(out) {
          var match
          if ((match = /^ERROR: (.*)$/.exec(out))) {
            throw new Error(match[1])
          }

          try {
            return JSON.parse(out)
          }
          catch (e) {
            throw new Error(out.toString())
          }
        })
    }

    function infoFromService(id) {
      return service.getDisplay(id)
    }

    function readInfo(id) {
      log.info('Reading display info')
      return infoFromService(id)
        .catch(function() {
          return infoFromMinicap(id)
        })
        .then(function(properties) {
          properties.url = screenOptions.publicUrl
          return new Display(id, properties)
        })
    }

    return readInfo(0).then(function(display) {
      service.on('rotationChange', function(data) {
        display.updateRotation(data.rotation)
      })

      return display
    })
  })
