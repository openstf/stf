var net = require('net')

var Promise = require('bluebird')
var syrup = require('syrup')

var wire = require('../../../wire')
var logger = require('../../../util/logger')
var lifecycle = require('../../../util/lifecycle')
var streamutil = require('../../../util/streamutil')
var forwardutil = require('../../../util/forwardutil')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../resources/minirev'))
  .define(function(options, adb, router, push, minirev) {
    var log = logger.createLogger('device:plugins:forward')
    var plugin = Object.create(null)

    function ForwardManager() {
      var forwards = Object.create(null)

      function Forward(conn, to) {
        var proxies = Object.create(null)

        function Proxy(fd) {
          function maybeSend() {
            var chunk
            while ((chunk = this.read())) {
              if (!conn.write(chunk)) {
                break
              }
            }
          }

          function killListeners() {
            src.removeListener('readable', maybeSend)
            conn.removeListener('drain', maybeSend)
            conn.removeListener('end', killListeners)
          }

          var src = new forwardutil.ForwardWriter(fd)
            .on('readable', maybeSend)
            .on('error', function(err) {
              log.error('Proxy writer %d had an error', fd, to, err.stack)
            })

          conn.on('drain', maybeSend)
          conn.on('end', killListeners)

          this.dest = net.connect(to)
            .once('end', function() {
              delete proxies[fd]
              killListeners()
            })
            .on('error', function(err) {
              log.error('Proxy reader %d had an error', fd, to, err.stack)
            })

          this.dest.pipe(src)

          this.stop = function() {
            //this.dest.unpipe(this.src)
            this.dest.end()
          }.bind(this)
        }

        conn.pipe(new forwardutil.ForwardParser())
          .on('packet', function(fd, packet) {
            var proxy = proxies[fd]

            if (!proxy) {
              // New connection
              proxy = proxies[fd] = new Proxy(fd)
            }

            proxy.dest.write(packet)
          })
          .on('fin', function(fd) {
            // The connection ended
            if (proxies[fd]) {
              proxies[fd].stop()
            }
          })

        this.end = function() {
          conn.end()
        }
      }

      this.add = function(port, conn, to) {
        forwards[port] = new Forward(conn, to)
      }

      this.remove = function(port) {
        if (forwards[port]) {
          forwards[port].end()
        }
      }
    }

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

    return startService()
      .then(awaitServer)
      .then(function() {
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
