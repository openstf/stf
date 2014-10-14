var net = require('net')

var Promise = require('bluebird')
var syrup = require('syrup')

var wire = require('../../../../wire')
var logger = require('../../../../util/logger')
var lifecycle = require('../../../../util/lifecycle')
var streamutil = require('../../../../util/streamutil')
var wireutil = require('../../../../wire/util')

var ForwardManager = require('./util/manager')

module.exports = syrup.serial()
  .dependency(require('../../support/adb'))
  .dependency(require('../../support/router'))
  .dependency(require('../../support/push'))
  .dependency(require('../../resources/minirev'))
  .dependency(require('../group'))
  .define(function(options, adb, router, push, minirev, group) {
    var log = logger.createLogger('device:plugins:forward')
    var plugin = Object.create(null)
    var manager = new ForwardManager()

    function startService() {
      log.info('Launching reverse port forwarding service')
      return adb.shell(options.serial, [
          'exec'
        , minirev.bin
        ])
        .timeout(10000)
        .then(function(out) {
          lifecycle.share('Forward shell', out)
          streamutil.talk(log, 'Forward shell says: "%s"', out)
        })
    }

    function connectService(times) {
      function tryConnect(times, delay) {
        return adb.openLocal(options.serial, 'localabstract:minirev')
          .timeout(10000)
          .catch(function(err) {
            if (/closed/.test(err.message) && times > 1) {
              return Promise.delay(delay)
                .then(function() {
                  return tryConnect(--times, delay * 2)
                })
            }
            return Promise.reject(err)
          })
      }
      log.info('Connecting to reverse port forwarding service')
      return tryConnect(times, 100)
    }

    function awaitServer() {
      return connectService(5)
        .then(function(conn) {
          conn.end()
          return true
        })
    }

    plugin.createForward = function(port, to) {
      log.info(
        'Creating reverse port forward from ":%d" to "%s:%d"'
      , port
      , to.host
      , to.port
      )
      return connectService(1)
        .then(function(out) {
          var header = new Buffer(4)
          header.writeUInt16LE(0, 0)
          header.writeUInt16LE(port, 2)
          out.write(header)
          return manager.add(port, out, to)
        })
    }

    plugin.removeForward = function(port) {
      log.info('Removing reverse port forward ":%d"', port)
      manager.remove(port)
      return Promise.resolve()
    }

    plugin.connect = function(options) {
      var resolver = Promise.defer()

      var conn = net.connect(options)

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

    plugin.reset = function() {
      manager.removeAll()
    }

    group.on('leave', plugin.reset)

    manager.on('add', function(port, to) {
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.DeviceForwardAddEvent(
          options.serial
        , port
        , to.host
        , to.port
        ))
      ])
    })

    manager.on('remove', function(port) {
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.DeviceForwardRemoveEvent(
          options.serial
        , port
        ))
      ])
    })

    return startService()
      .then(awaitServer)
      .then(function() {

        plugin.createForward(3000, {
          host: '127.0.0.1'
        , port: 3000
        })

        router
          .on(wire.ForwardTestMessage, function(channel, message) {
            var reply = wireutil.reply(options.serial)
            plugin.connect({
                host: message.targetHost
              , port: message.targetPort
              })
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
            plugin.createForward(message.devicePort, {
                host: message.targetHost
              , port: message.targetPort
              })
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
            plugin.removeForward(message.devicePort)
              .then(function() {
                push.send([
                  channel
                , reply.okay('success')
                ])
              })
              .catch(function(err) {
                log.error('Reverse port unforwarding failed', err.stack)
                push.send([
                  channel
                , reply.fail('fail')
                ])
              })
          })
      })
      .return(plugin)
  })
