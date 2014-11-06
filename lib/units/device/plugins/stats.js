var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var devutil = require('../../../util/devutil')
var lifecycle = require('../../../util/lifecycle')
var streamutil = require('../../../util/streamutil')

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
        .timeout(10000)
        .then(function() {
          return adb.shell(options.serial, [
              remote.bin
            , '--lib', remote.lib
            , '--listen-stats', service.port
            ])
            .timeout(10000)
            .then(function(out) {
              lifecycle.share('Stats shell', out)
              streamutil.talk(log, 'Stats shell says: "%s"', out)
            })
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, service.port)
            .timeout(15000)
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
