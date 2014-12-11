var util = require('util')
var path = require('path')
var http = require('http')

var Promise = require('bluebird')
var syrup = require('stf-syrup')
var httpProxy = require('http-proxy')
var adbkit = require('adbkit')

var logger = require('../../../util/logger')
var lifecycle = require('../../../util/lifecycle')
var streamutil = require('../../../util/streamutil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/storage'))
  .dependency(require('../resources/minicap'))
  .define(function(options, adb, router, push, storage, minicap) {
    var log = logger.createLogger('device:plugins:screen')
    var plugin = Object.create(null)

    plugin.devicePort = 9002

    plugin.privatePort = options.ports.pop()
    plugin.privateUrl = util.format(
      'ws://127.0.0.1:%s'
    , plugin.privatePort
    )

    plugin.publicPort = options.ports.pop()
    plugin.publicUrl = util.format(
      'ws://%s:%s'
    , options.publicIp
    , plugin.publicPort
    )

    function run(cmd) {
      return adb.shell(options.serial, util.format(
          'LD_LIBRARY_PATH=%s exec %s %s'
        , path.dirname(minicap.lib)
        , minicap.bin
        , cmd
        ))
    }

    function startService() {
      log.info('Launching screen service')
      return run(util.format('-p %d', plugin.devicePort))
        .timeout(10000)
        .then(function(out) {
          lifecycle.share('Screen shell', out)
          streamutil.talk(log, 'Screen shell says: "%s"', out)
        })
    }

    function forwardService() {
      log.info('Opening WebSocket service on port %d', plugin.privatePort)
      return adb.forward(
          options.serial
        , util.format('tcp:%d', plugin.privatePort)
        , util.format('tcp:%d', plugin.devicePort)
        )
        .timeout(10000)
    }

    function startProxy() {
      log.info('Starting WebSocket proxy on %s', plugin.publicUrl)

      var resolver = Promise.defer()

      function resolve() {
        lifecycle.share('Proxy server', proxyServer, {
          end: false
        })
        resolver.resolve()
      }

      function reject(err) {
        resolver.reject(err)
      }

      function ignore() {
        // No-op
      }

      var proxy = httpProxy.createProxyServer({
        target: plugin.privateUrl
      , ws: true
      , xfwd: false
      })

      proxy.on('error', ignore)

      var proxyServer = http.createServer()

      proxyServer.on('listening', resolve)
      proxyServer.on('error', reject)

      proxyServer.on('request', function(req, res) {
        proxy.web(req, res)
      })

      proxyServer.on('upgrade', function(req, socket, head) {
        proxy.ws(req, socket, head)
      })

      proxyServer.listen(plugin.publicPort)

      return resolver.promise.finally(function() {
        proxyServer.removeListener('listening', resolve)
        proxyServer.removeListener('error', reject)
      })
    }

    plugin.capture = function() {
      log.info('Capturing screenshot')

      var file = util.format('/data/local/tmp/minicap_%d.jpg', Date.now())
      return run(util.format('-s >%s', file))
        .then(adbkit.util.readAll)
        .then(function() {
          return adb.stat(options.serial, file)
        })
        .then(function(stats) {
          if (stats.size === 0) {
            throw new Error('Empty screenshot; possibly secure screen?')
          }

          return adb.pull(options.serial, file)
            .then(function(transfer) {
              return storage.store('image', transfer, {
                filename: util.format('%s.jpg', options.serial)
              , contentType: 'image/jpeg'
              , knownLength: stats.size
              })
            })
        })
        .finally(function() {
          return adb.shell(options.serial, ['rm', '-f', file])
            .then(adbkit.util.readAll)
        })
    }

    router.on(wire.ScreenCaptureMessage, function(channel) {
      var reply = wireutil.reply(options.serial)
      plugin.capture()
        .then(function(file) {
          push.send([
            channel
          , reply.okay('success', file)
          ])
        })
        .catch(function(err) {
          log.error('Screen capture failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    return startService()
      .then(forwardService)
      .then(startProxy)
      .then(function() {
        plugin.info = function(id) {
          return run(util.format('-d %d -i', id))
            .then(streamutil.readAll)
            .then(function(out) {
              var match
              if ((match = /^ERROR: (.*)$/.exec(out))) {
                throw new Error(match[1])
              }

              try {
                var info = JSON.parse(out)
                // Compat for now, remove eventually
                info.rotation = 0
                info.fps = 0
                info.secure = false
                return info
              }
              catch (e) {
                throw new Error(out.toString())
              }
            })
        }
      })
      .return(plugin)
  })
