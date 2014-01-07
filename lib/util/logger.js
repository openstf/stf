var util = require('util')

function Log(tag, stream) {
  this.tag = tag
  this.stream = stream || process.stderr
  this.levels = {
    DEBUG: 'DBG'
  , VERBOSE: 'VRB'
  , INFO: 'INF'
  , WARNING: 'WRN'
  , ERROR: 'ERR'
  , FATAL: 'FTL'
  }
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
  return util.format('%s %s/%s %d %s\n',
    Log.globalPrefix, priority, this.tag, process.pid,
    util.format.apply(util, args))
}

Log.prototype._write = function(out) {
  this.stream.write(out)
}

Log.globalPrefix = '*'

Log.createLogger = function(tag) {
  return new Log(tag)
}

Log.setGlobalPrefix = function(prefix) {
  Log.globalPrefix = prefix
}

exports = module.exports = Log
