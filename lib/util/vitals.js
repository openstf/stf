var events = require('events')
var util = require('util')

function Vitals() {
  events.EventEmitter.call(this)
}

util.inherits(Vitals, events.EventEmitter)

Vitals.prototype.register = function(name, stream) {
  var that = this

  stream.on('end', function() {
    that.emit('end', name)
  })

  stream.on('error', function(err) {
    that.emit('error', name, err)
  })

  return stream
}

module.exports = Vitals
