var util = require('util')
var assert = require('assert')
var http = require('http')

var Promise = require('bluebird')
var syrup = require('syrup')
var request = Promise.promisifyAll(require('request'))
var httpProxy = require('http-proxy')

var logger = require('../../../util/logger')
var devutil = require('../../../util/devutil')
var lifecycle = require('../../../util/lifecycle')
var streamutil = require('../../../util/streamutil')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../resources/remote'))
  .define(function(options, adb, remote) {
    var log = logger.createLogger('device:plugins:http')

    var service = {
      port: 2870
    , privateUrl: null
    , publicUrl: null
    }

    function openService() {
      log.info('Launching HTTP API')
      return devutil.ensureUnusedPort(adb, options.serial, service.port)
        .timeout(10000)
        .then(function() {
          return adb.shell(options.serial, [
              remote.bin
            , '--lib', remote.lib
            , '--listen-http', service.port
            ])
            .timeout(10000)
            .then(function(out) {
              lifecycle.share('Remote shell', out)
              streamutil.talk(log, 'Remote shell says: "%s"', out)
            })
            .then(function() {
              return devutil.waitForPort(adb, options.serial, service.port)
                .timeout(20000)
            })
            .then(function(conn) {
              var ours = options.ports.pop()
                , everyones = options.ports.pop()
                , url = util.format('http://127.0.0.1:%d', ours)

              // Don't need the connection
              conn.end()

              log.info('Opening device HTTP API forwarder on "%s"', url)

              service.privateUrl = url
              service.publicUrl = util.format(
                'http://%s:%s'
              , options.publicIp
              , everyones
              )

              return adb.forward(
                  options.serial
                , util.format('tcp:%d', ours)
                , util.format('tcp:%d', service.port)
                )
                .timeout(10000)
                .then(function() {
                  log.info(
                    'Opening HTTP API proxy on "http://%s:%s"'
                  , options.publicIp
                  , everyones
                  )

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

                  var proxy = httpProxy.createProxyServer({
                    target: url
                  , ws: false
                  , xfwd: false
                  })

                  var proxyServer = http.createServer(proxy.web)
                    .listen(everyones)

                  proxyServer.on('listening', resolve)
                  proxyServer.on('error', reject)

                  return resolver.promise.finally(function() {
                    proxyServer.removeListener('listening', resolve)
                    proxyServer.removeListener('error', reject)
                  })
                })
            })
        })
    }

    return openService()
      .then(function() {
        return {
          getDisplay: function(id) {
            return request.getAsync({
                url: util.format(
                  '%s/api/v1/displays/%d'
                , service.privateUrl
                , id
                )
              , json: true
              })
              .timeout(10000)
              .then(function(args) {
                var display = args[1]
                assert.ok('id' in display, 'Invalid response from HTTP API')
                // Fix rotation's old name
                if ('orientation' in display) {
                  display.rotation = display.orientation
                  delete display.orientation
                }
                return display
              })
          }
        , getDisplayUrl: function(id) {
            return util.format(
              '%s/api/v1/displays/%d/screenshot.jpg'
            , service.publicUrl
            , id
            )
          }
        }
      })
  })
