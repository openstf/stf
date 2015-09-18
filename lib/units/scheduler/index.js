var syrup = require('stf-syrup')
var async = require('async')

var lifecycle = require('../../../util/lifecycle')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var dbapi = requre('../../../db/api')

var timerInterval = 60 * 60 * 1000; // 1 hour
var targetRange = 60 * 60 * 1000; // 1 hour

module.exports = syrup.serial()
  // TODO: remove it if not required
  .dependency(require('../support/push'))
  .define(function(options, push) {

    var startSchedules = []; // {time, schedules[] }
    var endSchedules = []; // { time, devices[] }

    // set timer
    function setScheduleTimer() {

      // retreive target schedules
      var now = Date.now();
      var from = new Date();
      var to = new Date(Date.now() + targetRange);
      dbapi.loadScheduledDevices(from, to)
        .then(functions(cursor) {
          return Promise.promisify(cursor.toArray, cursor)()
            .then(function(list) {
              // TODO: parallelaize. why don't use async?
              list.forEach(function(schedule) {
                // check device status
                
              })
            })
        })
        .catch(function(err) {
          log.error('Failed to load schedule: ', err.stack)
        })

      
      // set timers
      
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
  })
