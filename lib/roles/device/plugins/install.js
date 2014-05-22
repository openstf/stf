var stream = require('stream')
var url = require('url')
var util = require('util')

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
      log.info('Installing "%s"', message.href)

      var reply = wireutil.reply(options.serial)

      function sendProgress(data, progress) {
        push.send([
          channel
        , reply.progress(data, progress)
        ])
      }

      function pushApp() {
        var req = request({
          url: url.resolve(options.storageUrl, message.href)
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
            .timeout(30000)
        })
        .then(function() {
          if (message.launch) {
            var manifest = JSON.parse(message.manifest)
            if (manifest.application.launcherActivities.length) {
              var launchActivity = {
                action: 'android.intent.action.MAIN'
              , component: util.format(
                  '%s/%s'
                , manifest.package
                , manifest.application.launcherActivities[0].name
                )
              , category: ['android.intent.category.LAUNCHER']
              , flags: 0x10200000
              }

              log.info(
                'Launching activity with action "%s" on component "%s"'
              , launchActivity.action
              , launchActivity.component
              )
              // Progress 90%
              sendProgress('launching_app', 90)
              return adb.startActivity(options.serial, launchActivity)
                .timeout(15000)
            }
          }
        })
        .then(function() {
          push.send([
            channel
          , reply.okay('success')
          ])
        })
        .catch(function(err) {
          log.error('Installation failed', err.stack)
          push.send([
            channel
          , reply.fail('fail')
          ])
        })
    })

    router.on(wire.UninstallMessage, function(channel, message) {
      log.info('Uninstalling "%s"', message.packageName)

      var reply = wireutil.reply(options.serial)

      adb.uninstall(options.serial, message.packageName)
        .then(function() {
          push.send([
            channel
          , reply.okay('success')
          ])
        })
        .catch(function(err) {
          log.error('Uninstallation failed', err.stack)
          push.send([
            channel
          , reply.fail('fail')
          ])
        })
    })
  })
