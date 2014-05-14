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
  .dependency(require('./service'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/sub'))
  .dependency(require('../support/channels'))
  .define(function(options, identity, service, router, push, sub, channels) {
    var log = logger.createLogger('device:plugins:group')
      , currentGroup = null
      , plugin = new events.EventEmitter()

    plugin.get = Promise.method(function() {
      if (!currentGroup) {
        throw new grouputil.NoGroupError()
      }

      return currentGroup
    })

    plugin.join = function(newGroup, timeout) {
      return plugin.get()
        .then(function() {
          if (currentGroup.group !== newGroup.group) {
            throw new grouputil.AlreadyGroupedError()
          }

          return currentGroup
        })
        .catch(grouputil.NoGroupError, function() {
          currentGroup = newGroup

          log.info('Now owned by "%s"', currentGroup.email)
          log.info('Subscribing to group channel "%s"', currentGroup.group)

          channels.register(currentGroup.group, timeout || options.groupTimeout)
          sub.subscribe(currentGroup.group)

          push.send([
            wireutil.global
          , wireutil.envelope(new wire.JoinGroupMessage(
              options.serial
            , currentGroup
            ))
          ])

          plugin.emit('join', currentGroup)

          return currentGroup
        })
    }

    plugin.leave = function() {
      return plugin.get()
        .then(function(group) {
          log.info('No longer owned by "%s"', group.email)
          log.info('Unsubscribing from group channel "%s"', group.group)

          channels.unregister(group.group)
          sub.unsubscribe(group.group)

          push.send([
            wireutil.global
          , wireutil.envelope(new wire.LeaveGroupMessage(
              options.serial
            , group
            ))
          ])

          currentGroup = null
          plugin.emit('leave', group)

          return group
        })
    }

    plugin.on('join', function() {
      service.acquireWakeLock()
      service.unlock()
    })

    plugin.on('leave', function() {
      service.releaseWakeLock()
      service.lock()
    })

    router
      .on(wire.GroupMessage, function(channel, message) {
        var reply = wireutil.reply(options.serial)
        grouputil.match(identity, message.requirements)
          .then(function() {
            return plugin.join(message.owner, message.timeout)
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
            return plugin.leave()
          })
          .then(function() {
            push.send([
              channel
            , reply.okay()
            ])
          })
          .catch(grouputil.NoGroupError, function(err) {
            push.send([
              channel
            , reply.fail(err.message)
            ])
          })
      })

    channels.on('timeout', function(channel) {
      if (currentGroup && channel === currentGroup.group) {
        plugin.leave()
      }
    })

    lifecycle.observe(function() {
      return plugin.leave()
        .catch(grouputil.NoGroupError, function() {
          return true
        })
    })

    return plugin
  })
