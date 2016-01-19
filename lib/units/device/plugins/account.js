var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('./service'))
  .dependency(require('./util/identity'))
  .dependency(require('./touch'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/adb'))
  .define(function(options, service, identity, touch, router, push, adb) {
    var log = logger.createLogger('device:plugins:account')

    function checkAccount(type, account) {
      return service.getAccounts({type: type})
        .timeout(30000)
        .then(function(accounts) {
          if (accounts.indexOf(account) >= 0) {
            return true
          }
          throw new Error('The account is not added')
        })
    }

    router.on(wire.AccountCheckMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)

      log.info('Checking if account "%s" is added', message.account)
      checkAccount(message.type, message.account)
        .then(function() {
            push.send([
              channel
            , reply.okay()
            ])
        })
        .catch(function(err) {
          log.error('Account check failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    router.on(wire.AccountGetMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)

      log.info('Getting account(s)')

      service.getAccounts(message)
        .timeout(30000)
        .then(function(accounts) {
          push.send([
            channel
          , reply.okay('success', accounts)
          ])
        })
        .catch(function(err) {
          log.error('Account get failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    router.on(wire.AccountRemoveMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)

      log.info('Removing "%s" account(s)', message.type)

      service.removeAccount(message)
        .timeout(30000)
        .then(function() {
          push.send([
            channel
          , reply.okay()
          ])
        })
        .catch(function(err) {
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
        .catch(function(err) {
          log.error('Add account menu failed', err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    router.on(wire.AccountAddMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)
      var type = 'com.google'
      var account = message.user + '@gmail.com'

      log.info('Adding Google Account automatedly')

      var version = identity.version.substring(0, 3)

      function automation() {
        switch (version) {
          case '2.3': // tested: 2.3.3-2.3.6
            return service.pressKey('dpad_down').delay(1000)
              .then(function() {
                return service.pressKey('dpad_down')
              }).delay(1000)
              .then(function() {
                return service.pressKey('enter')
              }).delay(2000)
              .then(function() {
                return service.pressKey('dpad_down')
              }).delay(2000)
              .then(function() {
                return service.pressKey('enter')
              }).delay(2000)
              .then(function() {
                return service.type(message.user)
              }).delay(1000)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('enter')
              }).delay(1000)
              .then(function() {
                return service.type(message.password)
              }).delay(1000)
              .then(function() {
                return service.pressKey('enter')
              })
          case '4.0': // tested: 4.0.3 and 4.0.4
            return service.pressKey('tab').delay(1000)
              .then(function() {
                return service.pressKey('enter')
              }).delay(2000)
              .then(function() {
                return service.type(message.user)
              }).delay(1000)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('enter')
              }).delay(1000)
              .then(function() {
                return service.type(message.password)
              }).delay(1000)
              .then(function() {
                return service.pressKey('enter')
              })
          case '4.1': // tested: 4.1.1 and 4.1.2
            return service.pressKey('tab').delay(1000)
              .then(function() {
                return service.pressKey('enter')
              }).delay(2000)
              .then(function() {
                return service.type(message.user)
              }).delay(1000)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('enter')
              }).delay(1000)
              .then(function() {
                return service.type(message.password)
              }).delay(1000)
              .then(function() {
                return service.pressKey('enter')
              })
          case '4.2': // tested: 4.2.2
            return service.pressKey('tab').delay(1000)
              .then(function() {
                return service.pressKey('enter')
              }).delay(2000)
              .then(function() {
                return service.type(message.user)
              }).delay(1000)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('enter')
              }).delay(1000)
              .then(function() {
                return service.type(message.password)
              }).delay(1000)
              .then(function() {
                return service.pressKey('enter')
              }).delay(1000)
              .then(function() {
                return service.pressKey('tab')
              }).delay(1000)
              .then(function() {
                return service.pressKey('tab')
              }).delay(1000)
              .then(function() {
                return service.pressKey('tab')
              }).delay(1000)
              .then(function() {
                return service.pressKey('enter')
              })
          // case '4.3': // tested: 4.3
          // case '4.4': // tested: 4.4.2
          default:
            return service.pressKey('tab').delay(1000)
              .then(function() {
                return service.pressKey('enter')
              }).delay(2000)
              .then(function() {
                return service.type(message.user)
              }).delay(1000)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('switch_charset')
              }).delay(100)
              .then(function() {
                return service.pressKey('enter')
              }).delay(1000)
              .then(function() {
                return service.type(message.password)
              }).delay(1000)
              .then(function() {
                return service.pressKey('enter')
              }).delay(1000)
              .then(function() {
                return service.pressKey('tab')
              }).delay(1000)
              .then(function() {
                return service.pressKey('tab')
              }).delay(1000)
              .then(function() {
                return service.pressKey('enter')
              })
        }
      }

      // First check if the account is already added so we don't continue
      return checkAccount(type, account)
        .then(function() {
          push.send([
            channel
          , reply.fail('Add account failed: account was already added')
          ])
        })
        .catch(function() {
          return adb.clear(options.serial, 'com.google.android.gsf.login')
            .catch(function() {
              // The package name is different in 2.3, so let's try the old name
              // if the new name fails.
              return adb.clear(options.serial, 'com.google.android.gsf')
            })
            .then(function() {
              return service.addAccountMenu()
            })
            .delay(5000)
            .then(function() {
              // Just in case the add account menu has any button focused
              return touch.tap({x: 0, y: 0.9})
            })
            .delay(500)
            .then(function() {
              return automation()
            })
            .delay(3000)
            .then(function() {
              return service.pressKey('home')
            })
            .then(function() {
              return checkAccount(type, account)
            })
            .then(function() {
              push.send([
                channel
              , reply.okay()
              ])
            })
            .catch(function(err) {
              log.error('Add account failed', err.stack)
              push.send([
                channel
              , reply.fail('Add account failed: ' + err.message)
              ])
            })
        })
    })
  })
