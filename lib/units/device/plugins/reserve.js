// npm modules
var events = require('events')

//third party
var Promise = require('bluebird')
var syrup = require('stf-syrup')

// stf utils
var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var grouputil = require('../../../util/grouputil')
var lifecycle = require('../../../util/lifecycle')


const RESERVATION_BUFFER = 15 * 1000

module.exports = syrup.serial()
  .dependency(require('./group'))
  .dependency(require('./solo'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, group, solo, router, push) {
    var log = logger.createLogger('device:plugins:reserve')
    var plugin = Object.create(null)
    var currentReservation = null
    var nextReservation = null
    var nextTimer = null

    function sendUpdateRequest() {
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.ReserveUpdateRequestMessage(
          options.serial
        , solo.channel
        ))
      ])
    }

    function checkCurrent() {
      return new Promise(function(resolve) {
        if (!currentReservation) {
          resolve()
          return
        }
        group.get()
          .then(function(currentGroup) {
            if (currentGroup.group !== currentReservation.owner.group) {
              group.leave('next_reservation')
                .then(function() {
                  resolve()
                })
            }
            else {
              resolve()
            }
          })
          .catch(grouputil.NoGroupError, function() {
            resolve()
          })
      })
    }

    function execReservation() {
      log.debug('exec reservation')
      currentReservation = nextReservation
      checkCurrent()
        .then(function() {
          return group.join(currentReservation.owner, options.groupTimeout, 'hoge')
        })
        .then(function() {
          sendUpdateRequest()
        })
    }

    function getNextTimerInterval() {
      var now = new Date().getTime()
      return (nextReservation.from - now - RESERVATION_BUFFER)
    }

    function setNextReserveTimer() {
      log.debug('set next reservation timer')
      clearInterval(nextTimer)
      if (!nextReservation) {
        return
      }
      var diff = getNextTimerInterval()
      log.debug('timer set:' + diff)
      log.debug('now:' + new Date())
      nextTimer = setTimeout(execReservation, diff)
    }


    // timer logic here

    // reserve update listener
    router
      .on(wire.ReserveUpdateMessage, function(channel, message) {
        log.debug('receive update message')
        currentReservation = message.current
        nextReservation = message.next
        checkCurrent()
          .then(function() {
            return setNextReserveTimer()
          })
      })

    // initialize
    ;(function() {
      log.debug('initialize process. bloadcast update request')
      sendUpdateRequest()
    })()

    lifecycle.observe(function() {
      // stop timer
    })

    return plugin
  })
