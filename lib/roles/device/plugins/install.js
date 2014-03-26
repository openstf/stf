var stream = require('stream')

var syrup = require('syrup')
var request = require('request')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, adb, router, push) {
    var log = logger.createLogger('device:plugins:install')

    router.on(wire.InstallMessage, function(channel, message) {
      log.info('Installing "%s"', message.url)
      var source = new stream.Readable().wrap(request(message.url))
      var seq = 0
      push.send([
        channel
      , wireutil.envelope(new wire.TransactionProgressMessage(
          options.serial
        , seq++
        , 'installing'
        ))
      ])
      adb.install(options.serial, source)
        .then(function() {
          if (message.launchActivity) {
            push.send([
              channel
            , wireutil.envelope(new wire.TransactionProgressMessage(
                options.serial
              , seq++
              , 'launching activity'
              ))
            ])
            log.info(
              'Launching activity with action "%s" on component "%s"'
            , message.launchActivity.action
            , message.launchActivity.component
            )
            return adb.startActivity(options.serial, message.launchActivity)
          }
        })
        .then(function() {
          log.info('Installed "%s"', message.url)
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
            , err.message
            ))
          ])
        })
    })
  })
