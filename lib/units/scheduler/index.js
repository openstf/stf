var syrup = require('stf-syrup')
var async = require('async')
var Promise = require('bluebird')
var zmq = require('zmq')

var logger = require('../../../util/logger')
var lifecycle = require('../../../util/lifecycle')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var dbapi = requre('../../../db/api')

var timerInterval = 60 * 60 * 1000; // 1 hour
var targetRange = 60 * 60 * 1000; // 1 hour
var ONEMINUTE = 60 * 1000

module.exports = function (options) {
  var timer = null
  var log = logger.createLogger('schduler')
  var push = zmq.socket('push')

  function setTimer() {
    clearTimeout(timer)
    timer = setTimeout(watchSchedule, ONEMINUTE)
  }

  function watchSchedule() {
    var now = Math.floor(Date.now() / ONEMINUTE) * ONEMINUTE;
    var from = new Date(now);
    var to = new Date(now + ONEMINUTE);
    watchStartSchedules(from, to)
    watchEndSchedules(from, to)
    setTimer()
  }

  function watchStartSchedules(from, to) {
    var users = {}
    Async.waterfall([
      function(next){
        dbapi.loadStartSchedles(from, to).then(function(cursor) {
          Promise.promisfy(cursor.toArray, cursor)().then(function(schedules) {
            next(null, schedules)
          })
        }).catch(function(err) {
          // todo: handle err
        })
      }
    , function (schedules, next) {
        emails = []
        schedules.forEach(function(schedule) {
          emails.push(schedule.email)
        })
        Async.map(emails, function(email) {
          return new Promise(function(resolve, reject) {
            dbapi.loadUser(email).then(function(user) {
              users[user.email] = user
              resolve(user)
            }).catch(function(err) {
              // TODO: handle error
              reject(err)
            })
          })
        }, function(userPromises){
          Promise.all(userPromises).then(function(userList) {
            var users = {}
            userList.forEach(function(user) {
              users[user.email] = user
            })
            next(null, schedules, users)
          })
        })
      }
    , function (schedules, users, next) {
        schedules.forEach(function(schedule) {
          dbapi.loadDevice(schedule.serial).then(function(device) {
            if (schedule.email !== device('owner')('email')) {
              // TODO: push leave message
            }
            // TODO: push join message
          })
        })
      }
    ], function(err, schedules, users) {
      if (err) {
        log.error('watch start schedule error')
      }
    })
  }
  
  function watchEndSchedules(from, to) {
    dbapi.loadEndSchedules(from, to).then(function(cursor) {
      cursor.each(function(err, schedule) {
        // load user data
        dbapi.loadUser(schedule.email)

        // update status
      })
    })
      .catch()
  }

  // update status
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
          }]
                        , function(err, something){
                          // TODO: finally block
                        });
        
      })
      .catch(function (err) {
        log.error('Failed to load group: ', err.stack)
        // TODO: error handling
      })
  }

  // TODO: apply interval from options params
  var timer = setInterval(setScheduleTimer, 60 * 60 * 1000)

  lifecycle.observe(function() {
    clearInterval(timer)
  })
}
