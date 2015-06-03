var util = require('util')

var EventEmitter = require('eventemitter3').EventEmitter

function TtlItem(value) {
  this.next = null
  this.prev = null
  this.time = null
  this.value = value
}

function TtlSet(ttl) {
  EventEmitter.call(this)
  this.head = null
  this.tail = null
  this.mapping = Object.create(null)
  this.ttl = ttl
  this.timer = null
}

util.inherits(TtlSet, EventEmitter)

TtlSet.SILENT = 1

TtlSet.prototype.bump = function(value, time, flags) {
  var item = this._remove(this.mapping[value]) || this._create(value, flags)

  item.time = time || Date.now()
  item.prev = this.tail

  this.tail = item

  if (item.prev) {
    item.prev.next = item
  }
  else {
    this.head = item
    this._scheduleCheck()
  }
}

TtlSet.prototype.drop = function(value, flags) {
  this._drop(this.mapping[value], flags)
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
      this._drop(item, 0)
    }
    else {
      break
    }
  }

  this._scheduleCheck()
}

TtlSet.prototype._create = function(value, flags) {
  var item = new TtlItem(value)

  this.mapping[value] = item

  if ((flags & TtlSet.SILENT) !== TtlSet.SILENT) {
    this.emit('insert', value)
  }

  return item
}

TtlSet.prototype._drop = function(item, flags) {
  if (item) {
    this._remove(item)

    delete this.mapping[item.value]

    if ((flags & TtlSet.SILENT) !== TtlSet.SILENT) {
      this.emit('drop', item.value)
    }
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
