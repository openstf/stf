var Promise = require('bluebird')
var syrup = require('syrup')
var monkey = require('adbkit-monkey')

var wire = require('../../../wire')
var devutil = require('../../../util/devutil')
var logger = require('../../../util/logger')
var lifecycle = require('../../../util/lifecycle')
var streamutil = require('../../../util/streamutil')
var SeqQueue = require('../../../wire/seqqueue')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../resources/remote'))
  .dependency(require('./display'))
  .define(function(options, adb, router, remote, display) {
    var log = logger.createLogger('device:plugins:touch')
    var plugin = Object.create(null)

    var service = {
      port: 2820
    }

    function openService() {
      log.info('Launching touch service')
      return devutil.ensureUnusedPort(adb, options.serial, service.port)
        .timeout(10000)
        .then(function() {
          return adb.shell(options.serial, [
              remote.bin
            , '--lib', remote.lib
            , '--listen-input', service.port
            ])
            .timeout(10000)
        })
        .then(function(out) {
          lifecycle.share('Touch shell', out)
          streamutil.talk(log, 'Touch shell says: "%s"', out)
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, service.port)
            .timeout(15000)
        })
        .then(function(conn) {
          return Promise.promisifyAll(monkey.connectStream(conn))
        })
        .then(function(monkey) {
          return lifecycle.share('Touch monkey', monkey)
        })
    }

    function modifyCoords(message) {
      message.x = Math.floor(message.x * display.width)
      message.y = Math.floor(message.y * display.height)
    }

    return openService()
      .then(function(monkey) {
        var queue = new SeqQueue()

        router
          .on(wire.TouchDownMessage, function(channel, message) {
            modifyCoords(message)
            queue.push(message.seq, function() {
              monkey.touchDownAsync(message.x, message.y)
                .catch(function(err) {
                  log.error('touchDown failed', err.stack)
                })
            })
          })
          .on(wire.TouchMoveMessage, function(channel, message) {
            modifyCoords(message)
            queue.push(message.seq, function() {
              monkey.touchMoveAsync(message.x, message.y)
                .catch(function(err) {
                  log.error('touchMove failed', err.stack)
                })
            })
          })
          .on(wire.TouchUpMessage, function(channel, message) {
            modifyCoords(message)
            queue.push(message.seq, function() {
              monkey.touchUpAsync(message.x, message.y)
                .catch(function(err) {
                  log.error('touchUp failed', err.stack)
                })
            })

            // Reset queue
            queue = new SeqQueue()
          })
          .on(wire.TapMessage, function(channel, message) {
            modifyCoords(message)
            monkey.tapAsync(message.x, message.y)
              .catch(function(err) {
                log.error('tap failed', err.stack)
              })
          })

        plugin.tap = function(coord) {
          modifyCoords(coord)
          monkey.tapAsync(coord.x, coord.y)
                .catch(function(err) {
                  log.error('tap failed', err.stack)
                })
        }
      }).return(plugin)

  })
