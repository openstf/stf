var util = require('util')

var EventEmitter = require('eventemitter3').EventEmitter

function BroadcastSet() {
  this.set = Object.create(null)
  this.count = 0
}

util.inherits(BroadcastSet, EventEmitter)

BroadcastSet.prototype.insert = function(id, ws) {
  if (!(id in this.set)) {
    this.set[id] = ws
    this.count += 1
    this.emit('insert', id)
    if (this.count === 1) {
      this.emit('nonempty')
    }
  }
}

BroadcastSet.prototype.remove = function(id) {
  if (id in this.set) {
    delete this.set[id]
    this.count -= 1
    this.emit('remove', id)
    if (this.count === 0) {
      this.emit('empty')
    }
  }
}

BroadcastSet.prototype.each = function(fn) {
  return Object.keys(this.set).forEach(function(id) {
    return fn(this.set[id])
  }, this)
}

module.exports = BroadcastSet
