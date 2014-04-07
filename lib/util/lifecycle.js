var Promise = require('bluebird')

var logger = require('./logger')
var log = logger.createLogger('util:lifecycle')
var _ = require('lodash')

function Lifecycle() {
  this.observers = []
  this.ending = false
  process.on('SIGINT', this.graceful.bind(this))
  process.on('SIGTERM', this.graceful.bind(this))
}

Lifecycle.prototype.share = function(name, emitter, options) {
  var opts = _.assign({
      end: true
    , error: true
    }
  , options
  )

  if (opts.end) {
    emitter.on('end', function() {
      if (!this.ending) {
        log.fatal('%s ended; we shall share its fate', name)
        this.fatal()
      }
    }.bind(this))
  }

  if (opts.error) {
    emitter.on('error', function(err) {
      if (!this.ending) {
        log.fatal('%s had an error', name, err.stack)
        this.fatal()
      }
    }.bind(this))
  }

  if (emitter.end) {
    this.observe(function() {
      emitter.end()
    })
  }

  return emitter
}

Lifecycle.prototype.graceful = function() {
  log.info('Winding down for graceful exit')

  this.ending = true

  var wait = Promise.all(this.observers.map(function(fn) {
    return fn()
  }))

  return wait.then(function() {
    process.exit(0)
  })
}

Lifecycle.prototype.fatal = function() {
  log.fatal('Shutting down due to fatal error')
  this.ending = true
  process.exit(1)
}

Lifecycle.prototype.observe = function(promise) {
  this.observers.push(promise)
}

module.exports = new Lifecycle()
