var net = require('net')

var Promise = require('bluebird')
var syrup = require('stf-syrup')
var _ = require('lodash')

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
                  return tryConnect(times - 1, delay * 2)
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

    plugin.createForward = function(id, forward) {
      log.info(
        'Creating reverse port forward "%s" from ":%d" to "%s:%d"'
      , id
      , forward.devicePort
      , forward.targetHost
      , forward.targetPort
      )
      return connectService(1)
        .then(function(out) {
          var header = new Buffer(4)
          header.writeUInt16LE(0, 0)
          header.writeUInt16LE(forward.devicePort, 2)
          out.write(header)
          return manager.add(id, out, forward)
        })
    }

    plugin.removeForward = function(id) {
      log.info('Removing reverse port forward "%s"', id)
      manager.remove(id)
      return Promise.resolve()
    }

    plugin.connect = function(options) {
      var resolver = Promise.defer()

      var conn = net.connect({
        host: options.targetHost
      , port: options.targetPort
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

    plugin.reset = function() {
      manager.removeAll()
    }

    group.on('leave', plugin.reset)

    var pushForwards = _.debounce(
      function() {
        push.send([
          wireutil.global
        , wireutil.envelope(new wire.ReverseForwardsEvent(
            options.serial
          , manager.listAll()
          ))
        ])
      }
    , 200
    )

    manager.on('add', pushForwards)
    manager.on('remove', pushForwards)

    return startService()
      .then(awaitServer)
      .then(function() {
        router
          .on(wire.ForwardTestMessage, function(channel, message) {
            var reply = wireutil.reply(options.serial)
            plugin.connect(message)
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
            plugin.createForward(message.id, message)
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
            plugin.removeForward(message.id)
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
