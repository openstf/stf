var events = require('events')
var r = require('rethinkdb')

var syrup = require('stf-syrup')

var db = require('./')

module.exports = syrup.serial()
  .define(function() {
    var dbEvent = new events.EventEmitter()

    dbEvent.watch = function(tableName) {
    }

    return dbEvent
  })
