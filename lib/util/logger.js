var util = require('util')
var colors = require('colors')

function Log(tag, stream) {
  this.tag = tag
  this.levels = {
    DEBUG: 'DBG'.grey
  , VERBOSE: 'VRB'.cyan
  , INFO: 'INF'.green
  , WARNING: 'WRN'.yellow
  , ERROR: 'ERR'.red
  , FATAL: 'FTL'.red
  }
  this.localIdentifier = null
}

Log.prototype.setLocalIdentifier = function(identifier) {
  this.localIdentifier = identifier
}

Log.prototype.debug = function() {
  this._write(this._format(this.levels.DEBUG, arguments))
}

Log.prototype.verbose = function() {
  this._write(this._format(this.levels.VERBOSE, arguments))
}

Log.prototype.info = function() {
  this._write(this._format(this.levels.INFO, arguments))
}

Log.prototype.warn = function() {
  this._write(this._format(this.levels.WARNING, arguments))
}

Log.prototype.error = function() {
  this._write(this._format(this.levels.ERROR, arguments))
}

Log.prototype.fatal = function() {
  this._write(this._format(this.levels.FATAL, arguments))
}

Log.prototype._format = function(priority, args) {
  return util.format('%s/%s %d [%s] %s',
    priority, this.tag, process.pid,
    this.localIdentifier || Log.globalIdentifier,
    util.format.apply(util, args))
}

Log.prototype._write = function(out) {
  console.error(out)
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
