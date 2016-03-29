var util = require('util')

var syrup = require('stf-syrup')
var Promise = require('bluebird')

var logger = require('../../../util/logger')
var grouputil = require('../../../util/grouputil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var lifecycle = require('../../../util/lifecycle')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('./group'))
  .dependency(require('./solo'))
  .dependency(require('./util/urlformat'))
  .define(function(options, adb, router, push, group, solo, urlformat) {
    var log = logger.createLogger('device:plugins:connect')
    var plugin = Object.create(null)
    var activeServer = null

    plugin.port = options.connectPort
    plugin.url = urlformat(options.connectUrlPattern, plugin.port)

    plugin.start = function() {
      return new Promise(function(resolve, reject) {
        if (plugin.isRunning()) {
          return resolve(plugin.url)
        }

        var server = adb.createTcpUsbBridge(options.serial, {
          auth: function(key) {
            var resolver = Promise.defer()

            function notify() {
              group.get()
                .then(function(currentGroup) {
                  push.send([
                    solo.channel
                  , wireutil.envelope(new wire.JoinGroupByAdbFingerprintMessage(
                      options.serial
                    , key.fingerprint
                    , key.comment
                    , currentGroup.group
                    ))
                  ])
                })
                .catch(grouputil.NoGroupError, function() {
                  push.send([
                    solo.channel
                  , wireutil.envelope(new wire.JoinGroupByAdbFingerprintMessage(
                      options.serial
                    , key.fingerprint
                    , key.comment
                    ))
                  ])
                })
            }

            function joinListener(group, identifier) {
              if (identifier !== key.fingerprint) {
                resolver.reject(new Error('Somebody else took the device'))
              }
            }

            function autojoinListener(identifier, joined) {
              if (identifier === key.fingerprint) {
                if (joined) {
                  resolver.resolve()
                }
                else {
                  resolver.reject(new Error('Device is already in use'))
                }
              }
            }

            group.on('join', joinListener)
            group.on('autojoin', autojoinListener)
            router.on(wire.AdbKeysUpdatedMessage, notify)

            notify()

            return resolver.promise
              .timeout(120000)
              .finally(function() {
                group.removeListener('join', joinListener)
                group.removeListener('autojoin', autojoinListener)
                router.removeListener(wire.AdbKeysUpdatedMessage, notify)
              })
          }
        })

        server.on('listening', function() {
          resolve(plugin.url)
        })

        server.on('connection', function(conn) {
          log.info('New remote ADB connection from %s', conn.remoteAddress)
          conn.on('userActivity', function() {
            group.keepalive()
          })
        })

        server.on('error', reject)

        log.info(util.format('Listening on port %d', plugin.port))
        server.listen(plugin.port)

        activeServer = server
        lifecycle.share('Remote ADB', activeServer)
      })
    }

    plugin.stop = Promise.method(function() {
      if (plugin.isRunning()) {
        activeServer.close()
        activeServer.end()
      }
    })

    plugin.end = Promise.method(function() {
      if (plugin.isRunning()) {
        activeServer.end()
      }
    })

    plugin.isRunning = function() {
      return !!activeServer
    }

    lifecycle.observe(plugin.stop)
    group.on('leave', plugin.end)

    router
      .on(wire.ConnectStartMessage, function(channel) {
        var reply = wireutil.reply(options.serial)
        plugin.start()
          .then(function(url) {
            push.send([
              channel
            , reply.okay(url)
            ])
          })
          .catch(function(err) {
            log.error('Unable to start remote connect service', err.stack)
            push.send([
              channel
            , reply.fail(err.message)
            ])
          })
      })
      .on(wire.ConnectStopMessage, function(channel) {
        var reply = wireutil.reply(options.serial)
        plugin.end()
          .then(function() {
            push.send([
              channel
            , reply.okay()
            ])
          })
          .catch(function(err) {
            log.error('Failed to stop connect service', err.stack)
            push.send([
              channel
            , reply.fail(err.message)
            ])
          })
      })

    return plugin.start()
      .return(plugin)
  })
