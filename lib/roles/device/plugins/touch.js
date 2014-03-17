var Promise = require('bluebird')
var syrup = require('syrup')
var split = require('split')
var monkey = require('adbkit-monkey')

var wire = require('../../../wire')
var devutil = require('../../../util/devutil')
var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/quit'))
  .dependency(require('../resources/remote'))
  .define(function(options, adb, router, quit, remote) {
    var log = logger.createLogger('device:plugins:touch')

    var service = {
      port: 2820
    }

    function openService() {
      log.info('Launching touch service')
      return devutil.ensureUnusedPort(adb, options.serial, service.port)
        .then(function() {
          return adb.shell(options.serial, [
            remote.bin
          , '--lib', remote.lib
          , '--listen-input', service.port
          ])
        })
        .then(function(out) {
          out.pipe(split())
            .on('data', function(chunk) {
              log.info('Remote says: "%s"', chunk)
            })
            .on('error', function(err) {
              log.fatal('Remote had an error', err.stack)
              quit.fatal()
            })
            .on('end', function() {
              log.fatal('Remote ended')
              quit.fatal()
            })
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, service.port)
        })
        .then(function(conn) {
          return Promise.promisifyAll(monkey.connectStream(conn))
        })
        .then(function(monkey) {
          return monkey
            .on('error', function(err) {
              log.fatal('Monkey had an error', err.stack)
              quit.fatal()
            })
            .on('end', function() {
              log.fatal('Monkey ended')
              quit.fatal()
            })
        })
    }

    return openService()
      .then(function(monkey) {
        router
          .on(wire.TouchDownMessage, function(channel, message) {
            monkey.touchDownAsync(message.x, message.y)
              .catch(function(err) {
                log.error('touchDown failed', err.stack)
              })
          })
          .on(wire.TouchMoveMessage, function(channel, message) {
            monkey.touchMoveAsync(message.x, message.y)
              .catch(function(err) {
                log.error('touchMove failed', err.stack)
              })
          })
          .on(wire.TouchUpMessage, function(channel, message) {
            monkey.touchUpAsync(message.x, message.y)
              .catch(function(err) {
                log.error('touchUp failed', err.stack)
              })
          })
          .on(wire.TapMessage, function(channel, message) {
            monkey.tapAsync(message.x, message.y)
              .catch(function(err) {
                log.error('tap failed', err.stack)
              })
          })

        return {}
      })
  })
