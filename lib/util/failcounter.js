var util = require('util')

var EventEmitter = require('eventemitter3').EventEmitter

function FailCounter(threshold, time) {
  EventEmitter.call(this)
  this.threshold = threshold
  this.time = time
  this.values = []
}

util.inherits(FailCounter, EventEmitter)

FailCounter.prototype.inc = function() {
  var now = Date.now()

  while (this.values.length) {
    if (now - this.values[0] >= this.time) {
      this.values.shift()
    }
    else {
      break
    }
  }

  this.values.push(now)

  if (this.values.length > this.threshold) {
    this.emit('exceedLimit', this.threshold, this.time)
  }
}

module.exports = FailCounter
