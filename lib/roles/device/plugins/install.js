var stream = require('stream')

var syrup = require('syrup')
var request = require('request')
var Promise = require('bluebird')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var promiseutil = require('../../../util/promiseutil')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, adb, router, push) {
    var log = logger.createLogger('device:plugins:install')

    router.on(wire.InstallMessage, function(channel, message) {
      log.info('Installing "%s"', message.url)

      var seq = 0

      function sendProgress(data, progress) {
        push.send([
          channel
        , wireutil.envelope(new wire.TransactionProgressMessage(
            options.serial
          , seq++
          , data
          , progress
          ))
        ])
      }

      function pushApp() {
        var req = request({
          url: message.url
        })

        // We need to catch the Content-Length on the fly or we risk
        // losing some of the initial chunks.
        var contentLength = null
        req.on('response', function(res) {
          contentLength = parseInt(res.headers['content-length'], 10)
        })

        var source = new stream.Readable().wrap(req)
        var target = '/data/local/tmp/_app.apk'

        return adb.push(options.serial, source, target)
          .timeout(10000)
          .then(function(transfer) {
            var resolver = Promise.defer()

            function progressListener(stats) {
              if (contentLength) {
                // Progress 0% to 70%
                sendProgress(
                  'pushing_app'
                , 50 * Math.max(0, Math.min(
                    50
                  , stats.bytesTransferred / contentLength
                  ))
                )
              }
            }

            function errorListener(err) {
              resolver.reject(err)
            }

            function endListener() {
              resolver.resolve(target)
            }

            transfer.on('progress', progressListener)
            transfer.on('error', errorListener)
            transfer.on('end', endListener)

            return resolver.promise.finally(function() {
              transfer.removeListener('progress', progressListener)
              transfer.removeListener('error', errorListener)
              transfer.removeListener('end', endListener)
            })
          })
      }

      // Progress 0%
      sendProgress('pushing_app', 0)
      pushApp()
        .then(function(apk) {
          var start = 50
            , end = 90
            , guesstimate = start

          sendProgress('installing_app', guesstimate)
          return promiseutil.periodicNotify(
              adb.installRemote(options.serial, apk)
            , 250
            )
            .progressed(function() {
              guesstimate = Math.min(
                end
              , guesstimate + 1.5 * (end - guesstimate) / (end - start)
              )
              sendProgress('installing_app', guesstimate)
            })
        })
        .timeout(30000)
        .then(function() {
          if (message.launchActivity) {
            log.info(
              'Launching activity with action "%s" on component "%s"'
            , message.launchActivity.action
            , message.launchActivity.component
            )
            // Progress 90%
            sendProgress('launching_app', 90)
            return adb.startActivity(options.serial, message.launchActivity)
          }
        })
        .timeout(15000)
        .then(function() {
          push.send([
            channel
          , wireutil.envelope(new wire.TransactionDoneMessage(
              options.serial
            , seq++
            , true
            , 'success'
            ))
          ])
        })
        .catch(function(err) {
          log.error('Installation failed', err.stack)
          push.send([
            channel
          , wireutil.envelope(new wire.TransactionDoneMessage(
              options.serial
            , seq++
            , false
            , 'fail'
            ))
          ])
        })
    })

    router.on(wire.UninstallMessage, function(channel, message) {
      log.info('Uninstalling "%s"', message.packageName)

      var seq = 0

      adb.uninstall(options.serial, message.packageName)
        .then(function() {
          push.send([
            channel
          , wireutil.envelope(new wire.TransactionDoneMessage(
              options.serial
            , seq++
            , true
            , 'success'
            ))
          ])
        })
        .catch(function(err) {
          log.error('Uninstallation failed', err.stack)
          push.send([
            channel
          , wireutil.envelope(new wire.TransactionDoneMessage(
              options.serial
            , seq++
            , false
            , 'fail'
            ))
          ])
        })
    })
  })
