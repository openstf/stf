var syrup = require('syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('./input'))
  .define(function(options, router, push, input) {
    var log = logger.createLogger('device:plugins:clipboard')

    router.on(wire.PasteMessage, function(channel, message) {
      log.info('Pasting "%s" to clipboard', message.text)
      var seq = 0
      input.paste(message.text)
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
          log.error('Paste failed', err.stack)
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

    router.on(wire.CopyMessage, function(channel) {
      log.info('Copying clipboard contents')
      var seq = 0
      input.copy()
        .then(function(content) {
          push.send([
            channel
          , wireutil.envelope(new wire.TransactionDoneMessage(
              options.serial
            , seq++
            , true
            , content
            ))
          ])
        })
        .catch(function(err) {
          log.error('Copy failed', err.stack)
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
