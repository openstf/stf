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
  .dependency(require('./solo'))
  .dependency(require('./service'))
  .dependency(require('../support/router'))
  .dependency(require('../support/channels'))
  .define(function(options, solo, ident, service, router, push, sub, channels) {
    var log = logger.createLogger('device:plugins:group')
    , timer = null
    , schedule = null

    function watchSchedule() {
      if (schedule) {
        // todo: check schedule on memory
      }
    }

    function loadNearestSchedule() {
      return new Promise(function(resolve) {
        // todo: load nearest schedule and store to memory
        resolve();
      })
    }
    function reloadSchedule() {
      loadNearestSchedule()
        .then(function(){
          watchSchedule()
        })
    }

    function joinGroup() {
      return new Promise(function(resolve) {
        resolve();
      })
    }

    function kickCurrentGroup() {
      return new Promise(function(resolve) {
        resolve();
      })
    }

    function setTimer() {
      timer = setInterval(watchSchedule, ONEMINUTE)
    }

    router
      .on(wire.DeviceScheduleUpdated, function(channel, message) {
        reloadSchedule()
      })


    lifecycle.observe(function() {
      clearTimeout(timer)
    })
  })
