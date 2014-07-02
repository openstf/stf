var syrup = require('syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('./service'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, service, router, push) {
    var log = logger.createLogger('device:plugins:account')

    router.on(wire.AccountRemoveMessage, function(channel) {
      var reply = wireutil.reply(options.serial)

      log.info('Removing current Google account(s)')

      service.removeAccount()
        .timeout(30000)
        .then(function() {
          push.send([
            channel
          , reply.okay()
          ])
        })
        .error(function(err) {
          log.error('Account removal failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    router.on(wire.AccountAddMenuMessage, function(channel) {
      var reply = wireutil.reply(options.serial)

      log.info('Showing add account menu for Google Account')

      service.addAccountMenu()
        .timeout(30000)
        .then(function() {
          push.send([
            channel
          , reply.okay()
          ])
        })
        .error(function(err) {
          log.error('Add account menu failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })
  })
