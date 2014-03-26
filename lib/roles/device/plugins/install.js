var stream = require('stream')
var util = require('util')

var syrup = require('syrup')
var request = require('request')
var Promise = require('bluebird')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, adb, router, push) {
    var log = logger.createLogger('device:plugins:install')

    function fetchResource(options) {
      var resolver = Promise.defer()

      function responseListener(res) {
        if (res.statusCode === 200) {
          resolver.resolve(res)
        }
        else {
          resolver.reject(new Error(util.format(
            'Resource "%s" returned HTTP %d'
          , options.url
          , res.statusCode
          )))
        }
      }

      function errorListener(err) {
        resolver.reject(err)
      }

      var req = request(options)
        .on('response', responseListener)
        .on('error', errorListener)

      return resolver.promise.finally(function() {
        req.removeListener('response', responseListener)
        req.removeListener('error', errorListener)
      })
    }

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

      sendProgress('Fetching app from server')
      fetchResource({url: message.url})
        .then(function(res) {
          var contentLength = parseInt(res.headers['content-length'], 10)
          var source = new stream.Readable().wrap(res)
          var target = '/data/local/tmp/_app.apk'

          sendProgress('Pushing app to the device', 0)
          return adb.push(options.serial, source, target)
            .then(function(transfer) {
              var resolver = Promise.defer()

              function progressListener(stats) {
                if (contentLength) {
                  sendProgress(
                    'Pushing app to the device'
                  , stats.bytesTransferred / contentLength
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
        })
        .then(function(apk) {
          sendProgress('Installing app')
          return adb.installRemote(options.serial, apk)
        })
        .then(function() {
          if (message.launchActivity) {
            log.info(
              'Launching activity with action "%s" on component "%s"'
            , message.launchActivity.action
            , message.launchActivity.component
            )
            sendProgress('Launching activity')
            return adb.startActivity(options.serial, message.launchActivity)
          }
        })
        .then(function() {
          push.send([
            channel
          , wireutil.envelope(new wire.TransactionDoneMessage(
              options.serial
            , seq++
            , true
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
            , 'Installation failed'
            ))
          ])
        })
    })
  })
