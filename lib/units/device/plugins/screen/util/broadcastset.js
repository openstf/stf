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

BroadcastSet.prototype.values = function() {
  return Object.keys(this.set).map(function(id) {
    return this.set[id]
  }, this)
}

BroadcastSet.prototype.keys = function() {
  return Object.keys(this.set)
}

BroadcastSet.prototype.get = function(id) {
  return this.set[id]
}

module.exports = BroadcastSet
