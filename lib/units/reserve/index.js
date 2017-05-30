// general npm module

// third party npm modules
var Promise = require('bluebird')
var syrup = require('stf-syrup')

// stf modules
var logger = require('../../util/logger')
var wire = require('../../wire')
var wirerouter = require('../../wire/router')
var wireutil = require('../../wire/util')
var zmqutil = require('../../util/zmqutil')
var srv = require('../../util/srv')
var lifecycle = require('../../util/lifecycle')

module.exports = function(options) {
  var log = logger.createLogger('reserve')
  return syrup.serial()
    .dependency(require('./support/sub'))
    .dependency(require('./support/push'))
    .define(function(options, sub, push) {
      var router = wirerouter()

      log.debug('reserve unit start')

      sub.on('message', router.handler())

      router
        .on(wire.ReserveUpdateRequestMessage, function(channel, message) {
          log.debug('receirve update request')
          log.debug(message)
          log.debug('send update message')
          var now = new Date().getTime()

          // dummy impl
          push.send([
            message.channel
          , wireutil.envelope(new wire.ReserveUpdateMessage(
              new wire.ReserveMessage(
                now - (15 * 60 * 1000),
                now + (1 * 60 * 1000),
                new wire.OwnerMessage(
                  'dummy-email@hoge.com',
                  'dummy-user',
                  'dummy-group'
                )
              ),
              new wire.ReserveMessage(
                now + (2 * 60 * 1000),
                now + (5 * 60 * 1000),
                new wire.OwnerMessage(
                  'me@mine.com',
                  'me',
                  '9B4h/O++S0qgEdB/TvE1dg=='
                )
              )
            ))
          ])
        })

      lifecycle.observe(function() {
        [push, sub].forEach(function(sock) {
          try {
            sock.close()
          }
          catch (err) {
            // No-op
          }
        })
       })
    })
    .consume(options)
    .catch(function(err) {
      log.fatal('Setup had an error', err.stack)
      lifecycle.fatal()
    })
}
