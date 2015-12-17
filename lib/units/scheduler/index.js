var crypto = require('crypto')

var uuid = require('node-uuid')
var zmq = require('zmq')
var syrup = require('stf-syrup')
var async = require('async')
var Promise = require('bluebird')

var srv = require('../../util/srv')
var logger = require('../../util/logger')
var lifecycle = require('../../util/lifecycle')
var dbapi = require('../../db/api')
var wirerouter = require('../../wire/router')
var wire = require('../../wire')
var wireutil = require('../../wire/util')

module.exports = function(options) {

  var log = logger.createLogger('scheduler')

  // Input
  var sub = zmq.socket('sub')
  Promise.map(options.endpoints.sub, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Receiving input from "%s"', record.url)
        sub.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to sub endpoint', err)
    lifecycle.fatal()
  })

  // Establish always-on channels
  ;[wireutil.global].forEach(function(channel) {
    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
  })

  // Output
  var push = zmq.socket('push')
  Promise.map(options.endpoints.push, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Sending output to "%s"', record.url)
        push.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to push endpoint', err)
    lifecycle.fatal()
  })

  function loadInitialState() {
    return dbapi.loadPresentDevices()
      .then(function(cursor) {
        return Promise.promisify(cursor.toArray, cursor)()
          .then(function(list) {
            list.forEach(function(device) {
              // todo: push nearest message
              pushNearestMessage()
            })
          })
      })
  }

  function listenReserveMessages() {
    sub.on('message', wirerouter()
      .on(wire.DeviceReadyMessage, function(channel, message) {
        log.debug('received device ready message', message.channel)
        // todo: load nearest or current schedule
        push.send([
          message.channel
        , wireutil.envelope(new wire.ReserveUpdatedMessage(
          'id', 'serial', 'email', 1234, 5678, false
          ))
        ])
      })
      .on(wire.ReserveFetchNextRequestMessage, function(channel, message) {
        log.debug('received fetch next message')
        // todo: load next message.
        push.send([
          message.channel
        , wireutil.envelope(new wire.ReserveUpdatedMessage(
            'id', 'serial', 'email', 1234, 5678, false
          ))
        ])
      })
      .handler())
  }

  function pushNearestMessage(serial, channel) {
    dbapi.loadNearestReservation(serial).then(function(schedule){
      push.send([
        channel,
      , wireutil.envelope(new wire.ReserveUpdatedMessage(
          schedule.id
        , serial
        , schedule.email
        , schedule.start
        , schedule.end
        , false
        ))
      ])
    })
  }

  log.info('Watch device schedules')

  lifecycle.observe(function() {
    log.debug('cleanup')

    // cleaning
    ;[push, sub].forEach(function(sock) {
      try {
        sock.close()
      }
      catch (err) {
        // No-op
      }
    })
  })

  listenReserveMessages();
}
