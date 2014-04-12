var util = require('util')
var cp = require('child_process')

var Promise = require('bluebird')

var log = require('./logger').createLogger('util:procutil')

function ExitError(code) {
  Error.call(this)
  this.name = 'ExitError'
  this.code = code
  this.message = util.format('Exit code "%d"', code)
  Error.captureStackTrace(this, ExitError)
}

util.inherits(ExitError, Error)

// Export
module.exports.ExitError = ExitError

// Export
module.exports.fork = function(filename, args) {
  log.info('Forking "%s %s"', filename, args.join(' '))

  var resolver = Promise.defer()
  var proc = cp.fork.apply(cp, arguments)

  function sigintListener() {
    proc.kill('SIGINT')
  }

  function sigtermListener() {
    proc.kill('SIGTERM')
  }

  process.on('SIGINT', sigintListener)
  process.on('SIGTERM', sigtermListener)

  proc.on('error', function(err) {
    resolver.reject(err)
    proc.kill()
  })

  proc.on('exit', function(code, signal) {
    if (signal) {
      resolver.resolve(code)
    }
    else if (code > 0 && code !== 130 && code !== 143) {
      resolver.reject(new ExitError(code))
    }
    else {
      resolver.resolve(code)
    }
  })

  return resolver.promise.cancellable()
    .finally(function() {
      process.removeListener('SIGINT', sigintListener)
      process.removeListener('SIGTERM', sigtermListener)
    })
    .catch(Promise.CancellationError, function() {
      return new Promise(function(resolve) {
        proc.on('exit', function() {
          resolve()
        })
        proc.kill()
      })
    })
}

// Export
module.exports.gracefullyKill = function(proc, timeout) {
  function killer(signal) {
    var deferred = Promise.defer()

    function onExit() {
      deferred.resolve()
    }

    proc.once('exit', onExit)
    proc.kill(signal)

    return deferred.promise.finally(function() {
      proc.removeListener('exit', onExit)
    })
  }

  return killer('SIGTERM')
    .timeout(timeout)
    .catch(function() {
      return killer('SIGKILL')
        .timeout(timeout)
    })
}
