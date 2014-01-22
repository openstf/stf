var events = require('events')
var util = require('util')

function ChannelManager() {
  events.EventEmitter.call(this)
  this.channels = Object.create(null)
}

util.inherits(ChannelManager, events.EventEmitter)

ChannelManager.prototype.register = function(id, timeout) {
  this.channels[id] = {
    timeout: timeout
  , lastActivity: Date.now()
  , timer: null
  }

  // Set timer with initial check
  this.check(id)
}

ChannelManager.prototype.unregister = function(id) {
  var channel = this.channels[id]
  delete this.channels[id]
  clearInterval(channel.timer)
}

ChannelManager.prototype.keepalive = function(id) {
  var channel = this.channels[id]
  if (channel) {
    channel.lastActivity = Date.now()
  }
}

ChannelManager.prototype.check = function(id) {
  var channel = this.channels[id]
    , inactivePeriod = Date.now() - channel.lastActivity

  if (inactivePeriod >= channel.timeout) {
    this.unregister(id)
    this.emit('timeout', id)
  }
  else if (channel.timeout < Infinity) {
    channel.timer = setTimeout(
      this.check.bind(this, id)
    , channel.timeout - inactivePeriod
    )
  }
}

module.exports = ChannelManager
