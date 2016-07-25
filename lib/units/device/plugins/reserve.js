var events = require('events')

var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var grouputil = require('../../../util/grouputil')
var lifecycle = require('../../../util/lifecycle')
var dbapi = require('../../../db/api')

var ONEMINUTE = 60 * 1000
var RESERVE_BUFFER = 30 * 1000

module.exports = syrup.serial()
  .dependency(require('./group'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/sub'))
  .dependency(require('../support/channels'))
  .define(function(options, group, router, push, sub, channels) {
    var log = logger.createLogger('device:plugins:reserve')
      , timer = null
      , nearestSchedule = null

    function watchSchedule() {
      log.debug('watch schedule')
      if (nearestSchedule) {
        if (isExpired()) {
          reloadRequest()
          nearestSchedule = null
        } else if (isCurrent()) {
          var currentGroup = null
          group.get()
            .then(function(current) {
              if (current.email != nearestSchedule.email) {
                return rejectOtherUser(current)
              }
              return false
            })
            .then(function() {
              joinRequest()
            })
            .catch(grouputil.NoGroupError, function() {
              joinRequest()
            })
        } else {
          setTimer()
        }
      }
    }

    function isCurrent() {
      var now = new Date().getTime() - RESERVE_BUFFER
      return nearestSchedule.start < now &&  now < nearestSchedule.end
    }

    function isExpired() {
      return nearestSchedule.end < new Date().getTime()
    }

    function rejectOtherUser() {
      return (function(current) {
        if (current.email != nearestSchedule.email) {
          return kickCurrentGroup()
        }
        return true
      })
    }

    function reloadRequest() {
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.ReserveFetchNextRequestMessage(
          options.serial
        , nearestSchedule? nearestSchedule.id : null
        ))
      ])
    }

    function reloadSchedule(reserveUpdateMessage) {
      nearestSchedule = reserveUpdateMessage
      watchSchedule()
    }

    function joinRequest() {
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.ReserveEnforceRequest(
          nearestSchedule.id
        , channels
        ))
      ])
    }

    function kickCurrentGroup() {
      return group.leave('reserved time')
    }

    function setTimer() {
      clearTimeout(timer)
      timer = setTimeout(watchSchedule, nearestSchedule.start - RESERVE_BUFFER)
    }

    router
      .on(wire.ReserveUpdatedMessage, function(channel, message) {
        log.debug('received device schedule updated message', message)
        reloadSchedule(message)
      })

    sub.on('message', function(channel, data){
      var wrapper = wire.Envelope.decode(data)
      log.debug('received message type', wire.ReverseMessageType[wrapper.type])
    })

    lifecycle.observe(function() {
      clearTimeout(timer)
    })

    reloadRequest()
  })
