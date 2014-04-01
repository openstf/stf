var Promise = require('bluebird')
var syrup = require('syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var devutil = require('../../../util/devutil')
var lifecycle = require('../../../util/lifecycle')

module.exports = syrup.serial()
  .dependency(require('./identity'))
  .dependency(require('./input'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/sub'))
  .dependency(require('../support/channels'))
  .define(function(options, identity, input, router, push, sub, channels) {
    var log = logger.createLogger('device:plugins:owner')
    var owner = null

    function isGrouped() {
      return !!owner
    }

    function isOwnedBy(someOwner) {
      return owner && owner.group == someOwner.group
    }

    function joinGroup(newOwner, timeout) {
      log.info('Now owned by "%s"', newOwner.email)
      log.info('Subscribing to group channel "%s"', newOwner.group)
      channels.register(newOwner.group, timeout)
      sub.subscribe(newOwner.group)
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.JoinGroupMessage(
          options.serial
        , newOwner
        ))
      ])
      input.acquireWakeLock()
      input.unlock()
      owner = newOwner
    }

    function leaveGroup() {
      log.info('No longer owned by "%s"', owner.email)
      log.info('Unsubscribing from group channel "%s"', owner.group)
      channels.unregister(owner.group)
      sub.unsubscribe(owner.group)
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.LeaveGroupMessage(
          options.serial
        , owner
        ))
      ])
      input.releaseWakeLock()
      input.lock()
      owner = null
    }

    channels.on('timeout', function(channel) {
      if (owner && channel === owner.group) {
        leaveGroup()
      }
    })

    router
      .on(wire.GroupMessage, function(channel, message) {
        var seq = 0
        if (devutil.matchesRequirements(identity, message.requirements)) {
          if (!isGrouped()) {
            joinGroup(message.owner, message.timeout)
            push.send([
              channel
            , wireutil.envelope(new wire.TransactionDoneMessage(
                options.serial
              , seq++
              , true
              ))
            ])
          }
          else if (isOwnedBy(message.owner)) {
            push.send([
              channel
            , wireutil.envelope(new wire.TransactionDoneMessage(
                options.serial
              , seq++
              , true
              ))
            ])
          }
          else {
            push.send([
              channel
            , wireutil.envelope(new wire.TransactionDoneMessage(
                options.serial
              , seq++
              , false
              ))
            ])
          }
        }
      })
      .on(wire.UngroupMessage, function(channel, message) {
        var seq = 0
        if (devutil.matchesRequirements(identity, message.requirements)) {
          if (isGrouped()) {
            leaveGroup()
            push.send([
              channel
            , wireutil.envelope(new wire.TransactionDoneMessage(
                options.serial
              , seq++
              , true
              ))
            ])
          }
          else {
            push.send([
              channel
            , wireutil.envelope(new wire.TransactionDoneMessage(
                options.serial
              , seq++
              , true
              ))
            ])
          }
        }
      })

    lifecycle.observe(function() {
      if (isGrouped()) {
        leaveGroup()
        return Promise.delay(500)
      }
      else {
        return true
      }
    })
  })
