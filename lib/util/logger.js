var util = require('util')
var events = require('events')

var colors = require('colors')

function Log(tag, stream) {
  this.tag = tag
  this.levels = {
    DEBUG: 1
  , VERBOSE: 2
  , INFO: 3
  , WARNING: 4
  , ERROR: 5
  , FATAL: 6
  }
  this.names = {
    1: 'DBG'
  , 2: 'VRB'
  , 3: 'INF'
  , 4: 'WRN'
  , 5: 'ERR'
  , 6: 'FTL'
  }
  this.colors = {
    1: 'grey'
  , 2: 'cyan'
  , 3: 'green'
  , 4: 'yellow'
  , 5: 'red'
  , 6: 'red'
  }
  this.localIdentifier = null
  events.EventEmitter.call(this)
}

util.inherits(Log, events.EventEmitter)

Log.Entry = function(timestamp, priority, tag, pid, identifier, message) {
  this.timestamp = timestamp
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

Log.prototype._entry = function(priority, args) {
  return new Log.Entry(
    Date.now()
  , priority
  , this.tag
  , process.pid
  , this.localIdentifier || Logger.globalIdentifier
  , util.format.apply(util, args)
  )
}

Log.prototype._format = function(entry) {
  return util.format('%s/%s %d [%s] %s'
    , this._name(entry.priority)
    , entry.tag
    , entry.pid
    , entry.identifier
    , entry.message
  )
}

Log.prototype._name = function(priority) {
  return this.names[priority][this.colors[priority]]
}

Log.prototype._write = function(entry) {
  console.error(this._format(entry))
  this.emit('entry', entry)
  Logger.emit('entry', entry)
}

var Logger = new events.EventEmitter()

Logger.globalIdentifier = '*'

Logger.createLogger = function(tag) {
  return new Log(tag)
}

Logger.setGlobalIdentifier = function(identifier) {
  Logger.globalIdentifier = identifier
  return Logger
}

exports = module.exports = Logger
