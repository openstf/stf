var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/sub'))
  .define(function(options, adb, router, push, sub) {
    var log = logger.createLogger('device:plugins:shell')

    router.on(wire.ShellCommandMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)

      log.info('Running shell command "%s"', message.command)

      adb.shell(options.serial, message.command)
        .timeout(10000)
        .then(function(stream) {
          var resolver = Promise.defer()
          var timer

          function forceStop() {
            stream.end()
          }

          function keepAliveListener(channel, message) {
            clearTimeout(timer)
            timer = setTimeout(forceStop, message.timeout)
          }

          function readableListener() {
            var chunk
            while ((chunk = stream.read())) {
              push.send([
                channel
              , reply.progress(chunk)
              ])
            }
          }

          function endListener() {
            push.send([
              channel
            , reply.okay(null)
            ])
            resolver.resolve()
          }

          function errorListener(err) {
            resolver.reject(err)
          }

          stream.setEncoding('utf8')

          stream.on('readable', readableListener)
          stream.on('end', endListener)
          stream.on('error', errorListener)

          sub.subscribe(channel)
          router.on(wire.ShellKeepAliveMessage, keepAliveListener)

          timer = setTimeout(forceStop, message.timeout)

          return resolver.promise.finally(function() {
            stream.removeListener('readable', readableListener)
            stream.removeListener('end', endListener)
            stream.removeListener('error', errorListener)
            sub.unsubscribe(channel)
            router.removeListener(wire.ShellKeepAliveMessage, keepAliveListener)
            clearTimeout(timer)
          })
        })
        .error(function(err) {
          log.error('Shell command "%s" failed', message.command, err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })
  })
