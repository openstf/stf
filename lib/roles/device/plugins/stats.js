var syrup = require('syrup')
var split = require('split')

var logger = require('../../../util/logger')
var devutil = require('../../../util/devutil')
var lifecycle = require('../../../util/lifecycle')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../resources/remote'))
  .define(function(options, adb, remote) {
    var log = logger.createLogger('device:plugins:stats')

    var service = {
      port: 2830
    }

    function openService() {
      return devutil.ensureUnusedPort(adb, options.serial, service.port)
        .then(function() {
          return adb.shell(options.serial, [
              remote.bin
            , '--lib', remote.lib
            , '--listen-stats', service.port
            ])
            .then(function(out) {
              lifecycle.share('Stats remote shell', out)
              out.pipe(split())
                .on('data', function(chunk) {
                  log.info('Remote says: "%s"', chunk)
                })
            })
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, service.port)
        })
        .then(function(conn) {
          return lifecycle.share('Stats connection', conn)
        })
    }

    return openService()
      .then(function() {
        return {}
      })
  })
