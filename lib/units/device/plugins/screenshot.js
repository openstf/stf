var http = require('http')
var util = require('util')

var syrup = require('syrup')
var Promise = require('bluebird')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/storage'))
  .dependency(require('./display'))
  .define(function(options, router, push, storage, display) {
    var log = logger.createLogger('device:plugins:screenshot')
    var plugin = Object.create(null)

    plugin.capture = function() {
      log.info('Capturing screenshot from %s', display.url)

      return new Promise(function(resolve, reject) {
        var req = http.get(display.url)

        function responseListener(res) {
          if (res.statusCode !== 200) {
            reject(new Error(util.format(
              'Screenshot capture failed: HTTP %d'
            , res.statusCode
            )))
          }
          else {
            resolve(storage.store('image', res, {
              filename: util.format('%s.jpg', options.serial)
            , contentType: 'image/jpeg'
            , knownLength: +res.headers['content-length']
            }))
          }
        }

        req.on('response', responseListener)
        req.on('error', reject)
      })
    }

    router.on(wire.ScreenCaptureMessage, function(channel) {
      var reply = wireutil.reply(options.serial)
      plugin.capture()
        .then(function(file) {
          push.send([
            channel
          , reply.okay('success', file)
          ])
        })
        .catch(function(err) {
          log.error('Screen capture failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    return plugin
  })
