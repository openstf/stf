var net = require('net')
var util = require('util')

var syrup = require('syrup')
var Promise = require('bluebird')
var split = require('split')

var logger = require('../../../util/logger')
var devutil = require('../../../util/devutil')
var streamutil = require('../../../util/streamutil')
var lifecycle = require('../../../util/lifecycle')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../resources/remote'))
  .define(function(options, adb, router, push, remote) {
    var log = logger.createLogger('device:plugins:forward')

    var service = {
      port: 2810
    , privatePorts: (function() {
        var ports = []
        for (var i = 2520; i <= 2540; ++i) {
          ports.push(i)
        }
        return ports
      })()
    , forwards: Object.create(null)
    }

    function openService() {
      log.info('Launching reverse port forwarding service')
      return devutil.ensureUnusedPort(adb, options.serial, service.port)
        .timeout(10000)
        .then(function() {
          return adb.shell(options.serial, [
              'exec'
            , remote.bin
            , '--lib', remote.lib
            , '--listen-forward', service.port
            ])
            .timeout(10000)
            .then(function(out) {
              lifecycle.share('Forward shell', out)
              streamutil.talk(log, 'Forward shell says: "%s"', out)
            })
            .then(function() {
              return devutil.waitForPort(adb, options.serial, service.port)
                .timeout(10000)
            })
            .then(function(conn) {
              conn.end()
            })
        })
    }

    function createForward(data) {
      log.info(
        'Reverse port forwarding port %d to %s:%d'
      , data.devicePort
      , data.targetHost
      , data.targetPort
      )

      var forward = service.forwards[data.devicePort]

      if (forward) {
        if (forward.targetHost === data.targetHost &&
            forward.targetPort === data.targetPort) {
          return Promise.resolve()
        }
        else if (forward.system) {
          return Promise.reject(new Error('Cannot rebind system port'))
        }
        else {
          removeForward(forward)
        }
      }

      return adb.openTcp(options.serial, service.port)
        .timeout(10000)
        .then(function(conn) {
          var resolver = Promise.defer()

          var forward = {
            devicePort: data.devicePort
          , targetHost: data.targetHost
          , targetPort: data.targetPort
          , system: !!data.system
          , privatePort: service.privatePorts.pop()
          , connection: conn
          }

          var parser = conn.pipe(split())

          parser.on('data', function(chunk) {
            var cmd = chunk.toString().trim()
            switch (cmd) {
              case 'OKAY':
                resolver.resolve(forward)
                break
              case 'FAIL':
                resolver.reject(new Error('Remote replied with FAIL'))
                break
              case 'CNCT':
                adb.openTcp(options.serial, forward.privatePort)
                  .done(function(dstream) {
                    return tryConnect(forward)
                      .then(function(ustream) {
                        ustream.pipe(dstream)
                        dstream.pipe(ustream)
                      })
                  })
                break
            }
          })

          // Keep this around
          function endListener() {
            removeForward(forward)
          }

          conn.on('end', endListener)

          conn.write(util.format(
            'FRWD %d %d\n'
          , forward.devicePort
          , forward.privatePort
          ))

          return resolver.promise
        })
    }

    function removeForward(data) {
      log.info('Removing reverse port forwarding on port %d', data.devicePort)
      var forward = service.forwards[data.devicePort]
      if (forward) {
        forward.connection.end()
        delete service.forwards[data.devicePort]
      }
    }

    function tryConnect(data) {
      var resolver = Promise.defer()

      var conn = net.connect({
        host: data.targetHost
      , port: data.targetPort
      })

      function connectListener() {
        resolver.resolve(conn)
      }

      function errorListener(err) {
        resolver.reject(err)
      }

      conn.on('connect', connectListener)
      conn.on('error', errorListener)

      return resolver.promise.finally(function() {
        conn.removeListener('connect', connectListener)
        conn.removeListener('error', errorListener)
      })
    }

    function resetForwards() {
      Object.keys(service.forwards).forEach(function(privatePort) {
        service.forwards[privatePort].connection.end()
        delete service.forwards[privatePort]
      })
    }

    function listForwards() {
      return Object.keys(service.forwards).map(function(privatePort) {
        var forward = service.forwards[privatePort]
        return {
          devicePort: forward.devicePort
        , targetHost: forward.targetHost
        , targetPort: forward.targetPort
        , system: !!forward.system
        }
      })
    }

    return openService()
      .then(function() {
        router
          .on(wire.ForwardTestMessage, function(channel, message) {
            var reply = wireutil.reply(options.serial)
            tryConnect(message)
              .then(function(conn) {
                conn.end()
                push.send([
                  channel
                , reply.okay('success')
                ])
              })
              .catch(function() {
                push.send([
                  channel
                , reply.fail('fail_connect')
                ])
              })
          })
          .on(wire.ForwardCreateMessage, function(channel, message) {
            var reply = wireutil.reply(options.serial)
            createForward(message)
              .then(function() {
                push.send([
                  channel
                , reply.okay('success')
                ])
              })
              .catch(function(err) {
                log.error('Reverse port forwarding failed', err.stack)
                push.send([
                  channel
                , reply.fail('fail_forward')
                ])
              })
          })
          .on(wire.ForwardRemoveMessage, function(channel, message) {
            var reply = wireutil.reply(options.serial)
            removeForward(message)
            push.send([
              channel
            , reply.okay('success')
            ])
          })
      })
  })
