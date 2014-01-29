var util = require('util')
var events = require('events')

var colors = require('colors')

function Log(tag, stream) {
  this.tag = tag
  this.levels = {
    DEBUG: 'DBG'
  , VERBOSE: 'VRB'
  , INFO: 'INF'
  , WARNING: 'WRN'
  , ERROR: 'ERR'
  , FATAL: 'FTL'
  }
  this.colors = {
    DBG: 'grey'
  , VRB: 'cyan'
  , INF: 'green'
  , WRN: 'yellow'
  , ERR: 'red'
  , FTL: 'red'
  }
  this.localIdentifier = null
  events.EventEmitter.call(this)
}

util.inherits(Log, events.EventEmitter)

Log.Entry = function(priority, tag, pid, identifier, message) {
  this.time = Date.now()
  this.priority = priority
  this.tag = tag
  this.pid = pid
  this.identifier = identifier
  this.message = message
}

Log.prototype.setLocalIdentifier = function(identifier) {
  this.localIdentifier = identifier
}

Log.prototype.debug = function() {
  this._write(this._entry(this.levels.DEBUG, arguments))
}

Log.prototype.verbose = function() {
  this._write(this._entry(this.levels.VERBOSE, arguments))
}

Log.prototype.info = function() {
  this._write(this._entry(this.levels.INFO, arguments))
}

Log.prototype.warn = function() {
  this._write(this._entry(this.levels.WARNING, arguments))
}

Log.prototype.error = function() {
  this._write(this._entry(this.levels.ERROR, arguments))
}

Log.prototype.fatal = function() {
  this._write(this._entry(this.levels.FATAL, arguments))
}

Log.prototype._color = function(priority) {
  return priority[this.colors[priority]]
}

Log.prototype._entry = function(priority, args) {
  return new Log.Entry(
    priority
  , this.tag
  , process.pid
  , this.localIdentifier || Log.globalIdentifier
  , util.format.apply(util, args)
  )
}

Log.prototype._format = function(entry) {
  return util.format('%s/%s %d [%s] %s'
    , this._color(entry.priority)
    , entry.tag
    , entry.pid
    , entry.identifier
    , entry.message
  )
}

Log.prototype._write = function(entry) {
  console.error(this._format(entry))
  this.emit('entry', entry)
}

Log.globalIdentifier = '*'

Log.createLogger = function(tag) {
  return new Log(tag)
}

Log.setGlobalIdentifier = function(identifier) {
  Log.globalIdentifier = identifier
  return Log
}

exports = module.exports = Log
