var util = require('util')
var cp = require('child_process')

var Promise = require('bluebird')

function ExitError(code) {
  Error.call(this, util.format('Exit code "%d"', code))
  this.name = 'ExitError'
  this.code = code
  Error.captureStackTrace(this, ExitError)
}

util.inherits(ExitError, Error)

// Export
module.exports.ExitError = ExitError

// Export
module.exports.fork = function() {
  var args = arguments

  return new Promise(function(resolve, reject) {
    var proc = cp.fork.apply(cp, args)

    proc.on('error', function(err) {
      reject(err)
      proc.kill()
    })

    proc.on('exit', function(code) {
      if (code > 0) {
        reject(new ExitError(code))
      }
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
