var stream = require('stream')
var url = require('url')
var util = require('util')

var syrup = require('stf-syrup')
var request = require('request')
var Promise = require('bluebird')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var promiseutil = require('../../../util/promiseutil')

// The error codes are available at https://github.com/android/
// platform_frameworks_base/blob/master/core/java/android/content/
// pm/PackageManager.java
function InstallationError(err) {
  return err.code && /^INSTALL_/.test(err.code)
}

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, adb, router, push) {
    var log = logger.createLogger('device:plugins:install')

    router.on(wire.InstallMessage, function(channel, message) {
      var manifest = JSON.parse(message.manifest)
      var pkg = manifest.package

      log.info('Installing package "%s" from "%s"', pkg, message.href)

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
          var end = 90
          var guesstimate = start

          sendProgress('installing_app', guesstimate)
          return promiseutil.periodicNotify(
              adb.installRemote(options.serial, apk)
                .timeout(60000 * 5)
                .catch(function(err) {
                  switch (err.code) {
                  case 'INSTALL_PARSE_FAILED_INCONSISTENT_CERTIFICATES':
                  case 'INSTALL_FAILED_VERSION_DOWNGRADE':
                    log.info(
                      'Uninstalling "%s" first due to inconsistent certificates'
                    , pkg
                    )
                    return adb.uninstall(options.serial, pkg)
                      .timeout(15000)
                      .then(function() {
                        return adb.installRemote(options.serial, apk)
                          .timeout(60000 * 5)
                      })
                  default:
                    return Promise.reject(err)
                  }
                })
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
        .then(function() {
          if (message.launch) {
            if (manifest.application.launcherActivities.length) {
              var activityName = manifest.application.launcherActivities[0].name

              // According to the AndroidManifest.xml documentation the dot is
              // required, but actually it isn't.
              if (activityName.indexOf('.') === -1) {
                activityName = util.format('.%s', activityName)
              }

              var launchActivity = {
                action: 'android.intent.action.MAIN'
              , component: util.format(
                  '%s/%s'
                , pkg
                , activityName
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
                .timeout(30000)
            }
          }
        })
        .then(function() {
          push.send([
            channel
          , reply.okay('INSTALL_SUCCEEDED')
          ])
        })
        .catch(Promise.TimeoutError, function(err) {
          log.error('Installation of package "%s" failed', pkg, err.stack)
          push.send([
            channel
          , reply.fail('INSTALL_ERROR_TIMEOUT')
          ])
        })
        .catch(InstallationError, function(err) {
          log.important(
            'Tried to install package "%s", got "%s"'
          , pkg
          , err.code
          )
          push.send([
            channel
          , reply.fail(err.code)
          ])
        })
        .catch(function(err) {
          log.error('Installation of package "%s" failed', pkg, err.stack)
          push.send([
            channel
          , reply.fail('INSTALL_ERROR_UNKNOWN')
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
