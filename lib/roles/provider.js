var adb = require('adbkit')
var Promise = require('bluebird')

module.exports = function(options) {
  var log = require('../util/logger').createLogger('provider')
  var client = Promise.promisifyAll(adb.createClient())
  var workers = Object.create(null)

  client.trackDevicesAsync()
    .then(function(tracker) {
      log.info('Tracking devices')

      tracker.on('add', function(device) {
        if (isWantedDevice(device)) {
          log.info('Found device "%s" (%s)', device.id, device.type)
          maybeConnect(device)
        }
        else {
          log.info('Ignoring device "%s" (%s)', device.id, device.type)
        }
      })

      tracker.on('change', function(device) {
        if (isWantedDevice(device)) {
          log.info('Device "%s" is now "%s"', device.id, device.type)
          maybeConnect(device) || maybeDisconnect(device)
        }
      })

      tracker.on('remove', function(device) {
        if (isWantedDevice(device)) {
          log.info('Lost device "%s" (%s)', device.id, device.type)
          maybeDisconnect(device)
        }
      })
    })

  function isWantedDevice(device) {
    return options.filter ? options.filter(device) : true
  }

  function isConnectable(device) {
    switch (device.type) {
      case 'device':
      case 'emulator':
        return true
      default:
        return false
    }
  }

  function isConnected(device) {
    return workers[device.id]
  }

  function maybeConnect(device) {
    if (isConnectable(device) && !isConnected(device)) {
      log.info('Spawning worker for device "%s"', device.id)
      var proc = options.fork(device)
      proc.on('error', function(err) {
        log.error('Device worker "%s" had an error: %s',
          device.id, err.message)
      })
      proc.on('exit', function(code, signal) {
        var data = workers[device.id]
        delete workers[device.id]
        if (code === 0) {
          log.info('Device worker "%s" stopped cleanly', device.id)
        }
        else {
          log.error('Device worker "%s" had a dirty exit (code %d)',
            device.id, code)
          if (Date.now() - data.started < 10000) {
            log.error('Device worker "%s" failed within 10 seconds of startup,' +
              ' will not attempt to restart', device.id)
          }
          else {
            log.info('Restarting worker of "%s"', device.id)
            maybeConnect(device)
          }
        }
      })
      workers[device.id] = {
        device: device
      , proc: proc
      , started: Date.now()
      }
      return true
    }
    return false
  }

  function maybeDisconnect(device) {
    if (isConnected(device)) {
      log.info('Releasing worker of %s', device.id)
      gracefullyKillWorker(device.id, function() { /* noop */ })
      return true
    }
    return false
  }

  function tryKillWorker(id) {
    var deferred = Promise.defer(),
        worker = workers[id]

    function onExit() {
      deferred.resolve()
    }

    worker.proc.once('exit', onExit)
    worker.proc.kill('SIGTERM')

    return deferred.promise.finally(function() {
      worker.proc.removeListener('exit', onExit)
    })
  }

  function forceKillWorker(id) {
    log.warn('Force killing worker of device "%s"', id)

    var deferred = Promise.defer()
      , worker = workers[id]

    function onExit() {
      deferred.resolve()
    }

    worker.proc.once('exit', onExit)
    worker.proc.kill('SIGKILL')

    return deferred.promise.finally(function() {
      worker.proc.removeListener('exit', onExit)
    })
  }

  function gracefullyKillWorker(id) {
    return tryKillWorker(id)
      .timeout(10000)
      .catch(function() {
        log.error('Device worker "%s" did not stop in time', id)
        return forceKillWorker(id)
          .timeout(10000)
          .then(deferred.resolve)
      })
  }

  function gracefullyExit() {
    log.info('Stopping all workers')
    Promise.all(Object.keys(workers).map(gracefullyKillWorker))
      .done(function() {
        log.info('All cleaned up')
        process.exit(0)
      })
  }

  process.on('SIGINT', function(e) {
    log.info('Received SIGINT')
    gracefullyExit()
  })

  process.on('SIGTERM', function(e) {
    log.info('Received SIGTERM')
    gracefullyExit()
  })
}
