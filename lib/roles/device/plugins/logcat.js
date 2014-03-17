var syrup = require('syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/quit'))
  .define(function(options, adb, router, quit) {
    var log = logger.createLogger('device:plugins:logcat')

    function openService() {
      log.info('Launching logcat service')
      return adb.openLogcat(options.serial)
        .then(function(logcat) {
          return logcat
            .on('error', function(err) {
              log.fatal('Logcat had an error', err)
              quit.fatal()
            })
            .on('end', function() {
              log.fatal('Logcat ended')
              quit.fatal()
            })
        })
    }

    return openService()
      .then(function(logcat) {
        function reset() {
          logcat
            .resetFilters()
            .excludeAll()
        }

        function entryListener(entry) {
          push.send([
            owner.group
          , wireutil.envelope(new wire.DeviceLogcatEntryMessage(
              options.serial
            , entry.date.getTime() / 1000
            , entry.pid
            , entry.tid
            , entry.priority
            , entry.tag
            , entry.message
            ))
          ])
        }

        logcat.on('entry', entryListener)

        router
          .on(wire.LogcatApplyFiltersMessage, function(channel, message) {
            reset()
            message.filters.forEach(function(filter) {
              logcat.include(filter.tag, filter.priority)
            })
          })

        reset()

        return logcat
      })
  })
