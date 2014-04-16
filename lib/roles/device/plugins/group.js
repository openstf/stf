var events = require('events')

var Promise = require('bluebird')
var syrup = require('syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var grouputil = require('../../../util/grouputil')
var lifecycle = require('../../../util/lifecycle')

module.exports = syrup.serial()
  .dependency(require('./identity'))
  .dependency(require('./input'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/sub'))
  .dependency(require('../support/channels'))
  .define(function(options, identity, input, router, push, sub, channels) {
    var log = logger.createLogger('device:plugins:group')
      , currentGroup = null
      , emitter = new events.EventEmitter()

    function joinGroup(newGroup, timeout) {
      if (currentGroup) {
        return Promise.reject(new grouputil.AlreadyGroupedError())
      }

      currentGroup = newGroup

      log.info('Now owned by "%s"', currentGroup.email)
      log.info('Subscribing to group channel "%s"', currentGroup.group)

      channels.register(currentGroup.group, timeout)
      sub.subscribe(currentGroup.group)

      push.send([
        wireutil.global
      , wireutil.envelope(new wire.JoinGroupMessage(
          options.serial
        , currentGroup
        ))
      ])

      input.acquireWakeLock()
      input.unlock()

      emitter.emit('join', currentGroup)

      return Promise.resolve(currentGroup)
    }

    function leaveGroup() {
      if (!currentGroup) {
        return Promise.reject(new grouputil.NotGroupedError())
      }

      log.info('No longer owned by "%s"', currentGroup.email)
      log.info('Unsubscribing from group channel "%s"', currentGroup.group)

      channels.unregister(currentGroup.group)
      sub.unsubscribe(currentGroup.group)

      push.send([
        wireutil.global
      , wireutil.envelope(new wire.LeaveGroupMessage(
          options.serial
        , currentGroup
        ))
      ])

      input.releaseWakeLock()
      input.lock()

      var oldGroup = currentGroup
      currentGroup = null

      emitter.emit('leave', oldGroup)

      return Promise.resolve(oldGroup)
    }

    channels.on('timeout', function(channel) {
      if (currentGroup && channel === currentGroup.group) {
        leaveGroup()
      }
    })

    router
      .on(wire.GroupMessage, function(channel, message) {
        var reply = wireutil.reply(options.serial)
        grouputil.match(identity, message.requirements)
          .then(function() {
            return joinGroup(message.owner)
          })
          .then(function() {
            push.send([
              channel
            , reply.okay()
            ])
          })
          .catch(grouputil.RequirementMismatchError, function(err) {
            push.send([
              channel
            , reply.fail(err.message)
            ])
          })
          .catch(grouputil.AlreadyGroupedError, function(err) {
            push.send([
              channel
            , reply.fail(err.message)
            ])
          })
      })
      .on(wire.UngroupMessage, function(channel, message) {
        var reply = wireutil.reply(options.serial)
        grouputil.match(identity, message.requirements)
          .then(function() {
            return leaveGroup()
          })
          .then(function() {
            push.send([
              channel
            , reply.okay()
            ])
          })
          .catch(grouputil.NotGroupedError, function(err) {
            push.send([
              channel
            , reply.fail(err.message)
            ])
          })
      })

    lifecycle.observe(function() {
      if (currentGroup) {
        leaveGroup()
        return Promise.delay(500)
      }
      else {
        return true
      }
    })

    return emitter
  })
