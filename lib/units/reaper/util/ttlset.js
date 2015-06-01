var util = require('util')

var EventEmitter = require('eventemitter3').EventEmitter

function TtlItem(value) {
  this.next = null
  this.prev = null
  this.time = null
  this.value = value
}

function TtlSet(ttl) {
  this.head = null
  this.tail = null
  this.mapping = Object.create(null)
  this.ttl = ttl
  this.timer = null
}

util.inherits(TtlSet, EventEmitter)

TtlSet.prototype.bump = function(value, time) {
  var item = this._remove(this.mapping[value]) || this._create(value)

  item.time = time || Date.now()
  item.prev = this.tail

  this.tail = item

  if (!this.head) {
    this.head = item
    this._scheduleCheck()
  }
}

TtlSet.prototype.drop = function(value) {
  this._drop(this.mapping[value])
}

TtlSet.prototype.stop = function() {
  clearTimeout(this.timer)
}

TtlSet.prototype._scheduleCheck = function() {
  clearTimeout(this.timer)
  if (this.head) {
    var delay = Math.max(0, this.ttl - (Date.now() - this.head.time))
    this.timer = setTimeout(this._check.bind(this), delay)
  }
}

TtlSet.prototype._check = function() {
  var now = Date.now()

  var item
  while ((item = this.head)) {
    if (now - item.time > this.ttl) {
      this._drop(item)
      this.emit('timeout', item.value)
    }
    else {
      break
    }
  }

  this._scheduleCheck()
}

TtlSet.prototype._create = function(value) {
  var item = new TtlItem(value)
  this.mapping[value] = item
  return item
}

TtlSet.prototype._drop = function(item) {
  if (item) {
    this._remove(item)
    delete this.mapping[item.value]
  }
}

TtlSet.prototype._remove = function(item) {
  if (!item) {
    return null
  }

  if (item.prev) {
    item.prev.next = item.next
  }

  if (item.next) {
    item.next.prev = item.prev
  }

  if (item === this.head) {
    this.head = item.next
  }

  if (item === this.tail) {
    this.tail = item.prev
  }

  item.next = item.prev = null

  return item
}

module.exports = TtlSet
