var events = require('events')
var util = require('util')
var fs = require('fs')

var uuid = require('node-uuid')

function Storage() {
  events.EventEmitter.call(this)
  this.files = Object.create(null)
  this.timer = setInterval(this.check.bind(this), 60000)
}

util.inherits(Storage, events.EventEmitter)

Storage.prototype.store = function(file) {
  var id = uuid.v4()
  this.set(id, file)
  return id
}

Storage.prototype.set = function(id, file) {
  this.files[id] = {
    timeout: 600000
  , lastActivity: Date.now()
  , data: file
  }

  return file
}

Storage.prototype.remove = function(id) {
  var file = this.files[id]
  if (file) {
    delete this.files[id]
    fs.unlink(file.data.path, function() {})
  }
}

Storage.prototype.retrieve = function(id) {
  var file = this.files[id]
  if (file) {
    file.lastActivity = Date.now()
    return file.data
  }
  return null
}

Storage.prototype.check = function() {
  var now = Date.now()

  Object.keys(this.files).forEach(function(id) {
    var file = this.files[id]
    var inactivePeriod = now - file.lastActivity

    if (inactivePeriod >= file.timeout) {
      this.remove(id)
      this.emit('timeout', id, file.data)
    }
  }, this)
}

Storage.prototype.stop = function() {
  clearInterval(this.timer)
}

module.exports = Storage
