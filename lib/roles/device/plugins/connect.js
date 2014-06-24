var util = require('util')

var syrup = require('syrup')
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
    var log = logger.createLogger('device:plugins:connect')
      , plugin = Object.create(null)
      , activeServer = null

    plugin.port = options.ports.pop()
    plugin.url = util.format('%s:%s', options.publicIp, plugin.port)

    plugin.start = function() {
      return new Promise(function(resolve, reject) {
        if (plugin.isRunning()) {
          return resolve(plugin.url)
        }

        var server = adb.createTcpUsbBridge(options.serial)

        server.on('listening', function() {
          resolve(plugin.url)
        })

        server.on('connection', function(conn) {
          log.info('New remote ADB connection from %s', conn.remoteAddress)
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
