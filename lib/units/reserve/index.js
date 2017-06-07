// general npm module

// third party npm modules
var Promise = require('bluebird')
var syrup = require('stf-syrup')

// stf modules
var logger = require('../../util/logger')
var wire = require('../../wire')
var wirerouter = require('../../wire/router')
var wireutil = require('../../wire/util')
var lifecycle = require('../../util/lifecycle')
var dbapi = require('../../db/api')

module.exports = function(options) {
  var log = logger.createLogger('reserve')
  return syrup.serial()
    .dependency(require('./support/sub'))
    .dependency(require('./support/push'))
    .define(function(options, sub, push) {
      var router = wirerouter()

      function makeReserveMessage(schedule, user) {
        return new wire.ReserveMessage(
          schedule.start.getTime()
        , schedule.end.getTime()
        , new wire.OwnerMessage(
            user.email
          , user.name
          , user.group
          )
        )
      }

      function getCurrentReserveMessage(serial) {
        var current = null
        return dbapi.loadCurrentSchedule(serial)
          .then(function(cursor) {
            return cursor.next()
          })
          .then(function(schedule) {
            current = schedule
            log.debug(schedule)
            return dbapi.loadUser(schedule.email)
          })
          .then(function(user) {
            return makeReserveMessage(current, user)
          })
          .catch(function() {
            return null
          })
      }

      function getNextReserveMessage(serial) {
        var next = null
        return dbapi.loadNextSchedule(serial)
          .then(function(cursor) {
            return cursor.next()
          })
          .then(function(schedule) {
            next = schedule
            return dbapi.loadUser(next.email)
          })
          .then(function(user) {
            return makeReserveMessage(next, user)
          })
          .catch(function() {
            return null
          })
      }

      function getDevice(serial) {
        return dbapi.loadDevice(serial)
      }

      function makeScheduleUpdateMessage(serial) {
        return Promise.resolve([
          getCurrentReserveMessage(serial)
        , getNextReserveMessage(serial)
        ])
        .spread(function(current, next) {
          return new wire.ReserveUpdateMessage(
            current
          , next
          )
        })
      }

      function onScheduleChange(changeFeed) {
        var serial = changeFeed.new_val ?
              changeFeed.new_val.serial :
              changeFeed.old_val.serial
        return Promise.resolve([
          getDevice(serial)
        , makeScheduleUpdateMessage(serial)
        ])
        .spread(function(device, message) {
          push.send([
            device.channel, wireutil.envelope(message)])
        })
      }

      // schedule table record event
      dbapi.watchTable('schedules')
        .then(function(cursor) {
          cursor.each(function(err, feed) {
            if (err) {
              log.error(err)
            }
            onScheduleChange(feed)
          })
        })
        .catch(function(err) {
          log.error(err)
        })


      // message handling
      router
        .on(wire.ReserveUpdateRequestMessage, function(channel, message) {
          log.debug('receirve update request')
          log.debug(message)
          makeScheduleUpdateMessage(message.serial)
            .then(function(message) {
              push.send([
                message.channel
                , message
              ])
            })
        })

      lifecycle.observe(function() {
        [push, sub].forEach(function(sock) {
          try {
            sock.close()
          }
          catch (err) {
            // No-op
          }
        })
       })
    })
    .consume(options)
    .catch(function(err) {
      log.fatal('Setup had an error', err.stack)
      lifecycle.fatal()
    })
}
