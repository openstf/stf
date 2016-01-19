var syrup = require('stf-syrup')
var Promise = require('bluebird')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var lifecycle = require('../../../util/lifecycle')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('./group'))
  .define(function(options, adb, router, push, group) {
    var log = logger.createLogger('device:plugins:logcat')
    var plugin = Object.create(null)
    var activeLogcat = null

    plugin.start = function(filters) {
      return group.get()
        .then(function(group) {
          return plugin.stop()
            .then(function() {
              log.info('Starting logcat')
              return adb.openLogcat(options.serial, {
                clear: true
              })
            })
            .timeout(10000)
            .then(function(logcat) {
              activeLogcat = logcat

              function entryListener(entry) {
                push.send([
                  group.group
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

              return plugin.reset(filters)
            })
        })
    }

    plugin.stop = Promise.method(function() {
      if (plugin.isRunning()) {
        log.info('Stopping logcat')
        activeLogcat.end()
        activeLogcat = null
      }
    })

    plugin.reset = Promise.method(function(filters) {
      if (plugin.isRunning()) {
        activeLogcat
          .resetFilters()

        if (filters.length) {
          activeLogcat.excludeAll()
          filters.forEach(function(filter) {
            activeLogcat.include(filter.tag, filter.priority)
          })
        }
      }
      else {
        throw new Error('Logcat is not running')
      }
    })

    plugin.isRunning = function() {
      return !!activeLogcat
    }

    lifecycle.observe(plugin.stop)
    group.on('leave', plugin.stop)

    router
      .on(wire.LogcatStartMessage, function(channel, message) {
        var reply = wireutil.reply(options.serial)
        plugin.start(message.filters)
          .then(function() {
            push.send([
              channel
            , reply.okay('success')
            ])
          })
          .catch(function(err) {
            log.error('Unable to open logcat', err.stack)
            push.send([
              channel
            , reply.fail('fail')
            ])
          })
      })
      .on(wire.LogcatApplyFiltersMessage, function(channel, message) {
        var reply = wireutil.reply(options.serial)
        plugin.reset(message.filters)
          .then(function() {
            push.send([
              channel
            , reply.okay('success')
            ])
          })
          .catch(function(err) {
            log.error('Failed to apply logcat filters', err.stack)
            push.send([
              channel
            , reply.fail('fail')
            ])
          })
      })
      .on(wire.LogcatStopMessage, function(channel) {
        var reply = wireutil.reply(options.serial)
        plugin.stop()
          .then(function() {
            push.send([
              channel
            , reply.okay('success')
            ])
          })
          .catch(function(err) {
            log.error('Failed to stop logcat', err.stack)
            push.send([
              channel
            , reply.fail('fail')
            ])
          })
      })

    return plugin
  })
