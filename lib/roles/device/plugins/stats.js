var syrup = require('syrup')
var split = require('split')

var logger = require('../../../util/logger')
var devutil = require('../../../util/devutil')

module.exports = syrup()
  .dependency(require('../support/adb'))
  .dependency(require('../support/quit'))
  .dependency(require('../resources/remote'))
  .define(function(options, adb, quit, remote) {
    var log = logger.createLogger('device:plugins:stats')

    var service = {
      port: 2830
    }

    function openService() {
      return devutil.ensureUnusedPort(adb, options.serial, service.port)
        .then(function(port) {
          return adb.shell(options.serial, [
              remote.bin
            , '--lib', remote.lib
            , '--listen-stats', service.port
            ])
            .then(function(out) {
              out.pipe(split())
                .on('data', function(chunk) {
                  log.info('Remote says: "%s"', chunk)
                })
                .on('error', function(err) {
                  log.fatal('Remote shell had an error', err.stack)
                  quit.fatal()
                })
                .on('end', function() {
                  log.fatal('Remote shell ended')
                  quit.fatal()
                })
            })
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, service.port)
        })
        .then(function(conn) {
          conn.pipe(split())
            .on('error', function(err) {
              log.fatal('Remote had an error', err.stack)
              quit.fatal()
            })
            .on('end', function() {
              log.fatal('Remote ended')
              quit.fatal()
            })
        })
    }

    return openService()
      .then(function() {
        return {}
      })
  })
