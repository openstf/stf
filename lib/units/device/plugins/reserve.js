var events = require('events')

var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var lifecycle = require('../../../util/lifecycle')
var dbapi = require('../../../db/api')

var ONEMINUTE = 60 * 1000

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
        // todo: check nearest or current schedule
        if (true) {
          kickCurrentGroup()
            .then(function(){
              joinGroup()
            })
        }

        if (true) {
          log.debug('todo: push fetch next request')
          push.send([
            wireutil.global
          , wireutil.envelope(new wire.ReserveFetchNextRequestMessage(
              nearestSchedule.id
            , 'hoge'
            ))
          ])
        }
      }
    }

    function reloadSchedule(reserveUpdateMessage) {
      // todo: check and update nearestSchedule
      if (true) {
        nearestSchedule = reserveUpdateMessage
      }

      watchSchedule()
    }

    function joinGroup() {
      return new Promise(function(resolve) {
        log.debug('// todo: join to reservation owner')
        resolve()
      })
    }

    function kickCurrentGroup() {
      return new Promise(function(resolve) {
        // todo: kick current owner
        resolve();
      })
    }

    function setTimer() {
      clearTimeout(timer)
      timer = setInterval(watchSchedule, ONEMINUTE)
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


    log.debug('reserve plugin waiting')

    lifecycle.observe(function() {
      clearTimeout(timer)
    })
  })
