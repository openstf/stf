var util = require('util')

var EventEmitter = require('eventemitter3').EventEmitter

function RiskyStream(stream) {
  this.endListener = function() {
    this.ended = true
    this.stream.removeListener('end', this.endListener)

    if (!this.expectingEnd) {
      this.emit('unexpectedEnd')
    }

    this.emit('end')
  }.bind(this)

  this.stream = stream
    .on('end', this.endListener)
  this.expectingEnd = false
  this.ended = false
}

util.inherits(RiskyStream, EventEmitter)

RiskyStream.prototype.end = function() {
  this.expectEnd()
  return this.stream.end()
}

RiskyStream.prototype.expectEnd = function() {
  this.expectingEnd = true
  return this
}

module.exports = RiskyStream
