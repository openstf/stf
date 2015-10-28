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

var transaction = require('./support/transaction')

var timerInterval = 60 * 60 * 1000; // 1 hour
var targetRange = 60 * 60 * 1000; // 1 hour
var ONEMINUTE = 60 * 1000

var timer = null

module.exports = function(options) {

  var log = logger.createLogger('schduler')
  var mychannel = makeChannelId()

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

  sub.subscribe(mychannel)
  var router = wirerouter()

  sub.on('message', router.handler())

  function makeChannelId() {
    var id = uuid.v4()
    var hash = crypto.createHash('sha1')
    hash.update(id)
    return hash.digest('base64')
  }

  function setTimer() {
    clearTimeout(timer)
    var now = Date.now()
    var delay = Math.floor((now + ONEMINUTE) / ONEMINUTE) * ONEMINUTE - now
    timer = setTimeout(watchSchedule, delay)
  }

  function watchSchedule() {
    var now = Math.floor(Date.now() / ONEMINUTE) * ONEMINUTE;
    var from = new Date(now);
    var to = new Date(now + ONEMINUTE);
    log.debug('check schedule from [%s] to [%s]', from, to)
    watchStartSchedules(from, to)
    watchEndSchedules(from, to)
    setTimer()
  }

  function watchStartSchedules(from, to) {
    async.waterfall([
      // load schedule
      function(next){
        dbapi.loadStartSchedules(from, to).then(function(cursor) {
          Promise.promisify(cursor.toArray, cursor)().then(function(schedules) {
            next(null, schedules)
          })
        }).catch(function(err) {
          log.error('Unable to load start schedules', err.stack)
          next(err)
        })
      }
      // load new user
    , function (schedules, next) {
        var emails = {}
        schedules.forEach(function(schedule) {
          emails[schedule.email] = null
        })
        async.map(Object.keys(emails), function(email, callback) {
          dbapi.loadUser(email).then(function(user) {
            callback(null, user)
          })
            .catch(function(err) {
              log.error('Unable to load user', err.stack)
              callback(err)
            })
        }, function(err, userPromises){
          if (err) {
            log.error('Unable to load user', err.stack)
            next(err)
          }
          Promise.all(userPromises).then(function(userList) {
            var users = {}
            userList.forEach(function(user) {
              users[user.email] = user
            })
            next(null, schedules, users)
          })
          .catch(function (e) {
            log.error('Unable to load user. ', e.stack)
            next(e)
          })
        })
      }
      // exec schedule
    , function (schedules, users, next) {
        schedules.forEach(function(schedule) {
          dbapi.loadDevice(schedule.serial).then(function(device) {
            var newuser = users[schedule.email]
            if (newuser) {
              log.info('serial[%s]]: booked by user [%s]', device.serial, newuser.email)
              execBooking(device, newuser, schedule)
            }
          })
        })
      }
    ], function(err, schedules, users) {
      if (err) {
        log.error('watch start schedule error', err.stack)
      }
    })
  }

  function watchEndSchedules(from, to) {
    dbapi.loadEndSchedules(from, to).then(function(cursor) {
      // todo: imple
      cursor.each(function(err, schedule) {
        // load user data
        dbapi.loadUser(schedule.email)

        // update status
      })
    })
    .catch()
  }

  function execBooking(device, newUser, schedule) {
    async.waterfall([function(next){
      if (device['owner'] && newUser.email !== device['owner']['email']) {
        rejectUser(device).then(function(data){
          next(null)
        })
      } else {
        next(null)
      }
    }]
    , function(err){
      joinBookedUserGroup(device, newUser, schedule)
    })
  }

  function rejectUser(device) {
    log.info('reject user [%s]', device['owner']['email'])
    var tx = transaction({ sub: sub})
    push.send([
      device.channel
    , wireutil.transaction(
        tx.channel
      , new wire.UngroupMessage(
          new wire.DeviceRequirement(
            'serial'
          , device.serial
          , wire.RequirementType.EXACT
          )
        )
      )
    ])
    return tx.promise
  }

  function joinBookedUserGroup(device, user, schedule) {
    var tx = transaction( {sub:  sub} )
    var timeout = schedule.end - Date.now()

    push.send([
      device.channel
    , wireutil.transaction(
        tx.channel
      , new wire.GroupMessage(
          new wire.OwnerMessage(
            user.email
          , user.name
          , user.group
          )
        , timeout
        , new wire.DeviceRequirement(
            'serial'
          , device.serial
          , wire.RequirementType.EXACT
          )
        )
      )
    ])
    return tx.promise
  }

  function updateDeviceStatus(schedule) {
    dbapi.loadDevice(schedule['serial'])
      .then(function(device) {
        // TODO: judge device owner and scheduled user

        async.waterfall([
          function (device, next) {
            // TODO: retreive user data
          }
          , function updateDeviceStatus(device, user, next) {
            // TODO: update owner and status
          }
        ], function(err, something){
          // TODO: finally block
        });
      })
      .catch(function (err) {
        log.error('Failed to load group: ', err.stack)
        // TODO: error handling
      })
  }

  lifecycle.observe(function() {
    log.debug('kill timer')
    clearInterval(timer)

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

  watchSchedule()
}
