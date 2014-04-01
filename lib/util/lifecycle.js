var Promise = require('bluebird')

var logger = require('./logger')
var log = logger.createLogger('util:lifecycle')

function Lifecycle() {
  this.observers = []
  process.on('SIGINT', this.graceful.bind(this))
  process.on('SIGTERM', this.graceful.bind(this))
}

Lifecycle.prototype.share = function(name, emitter) {
  emitter.on('end', function() {
    log.fatal('%s ended; we shall share its fate', name)
    this.fatal()
  }.bind(this))

  emitter.on('error', function(err) {
    log.fatal('%s had an error', name, err.stack)
    this.fatal()
  }.bind(this))

  return emitter
}

Lifecycle.prototype.graceful = function() {
  log.info('Winding down for graceful exit')

  var wait = Promise.all(this.observers.map(function(fn) {
    return fn()
  }))

  return wait.then(function() {
    process.exit(0)
  })
}

Lifecycle.prototype.fatal = function() {
  log.fatal('Shutting down due to fatal error')
  process.exit(1)
}

Lifecycle.prototype.observe = function(promise) {
  this.observers.push(promise)
}

module.exports = new Lifecycle()
