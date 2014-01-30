var path = require('path')
var events = require('events')

var adb = require('adbkit')
var Promise = require('bluebird')
var zmq = require('zmq')

var logger = require('../util/logger')
var wire = require('../wire')
var wireutil = require('../util/wireutil')(wire)

module.exports = function(options) {
  var log = logger.createLogger('provider')
  var client = Promise.promisifyAll(adb.createClient())
  var workers = Object.create(null)
  var tracker = new events.EventEmitter()
  var counter = 0

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('Sending output to %s', endpoint)
    push.connect(endpoint)
  })

  tracker.on('add', function(device) {
    pushDeviceStatus(device, device.type)
    maybeConnect(device)
  })

  tracker.on('change', function(device) {
    pushDeviceStatus(device, device.type)
    maybeConnect(device) || maybeDisconnect(device)
  })

  tracker.on('remove', function(device) {
    pushDeviceStatus(device, 'absent')
    maybeDisconnect(device)
  })

  client.trackDevicesAsync()
    .then(function(unfilteredTracker) {
      log.info('Tracking devices')

      unfilteredTracker.on('add', function(device) {
        if (isWantedDevice(device)) {
          log.info('Found device "%s" (%s)', device.id, device.type)
          tracker.emit('add', device)
        }
        else {
          log.info('Ignoring device "%s" (%s)', device.id, device.type)
        }
      })

      unfilteredTracker.on('change', function(device) {
        if (isWantedDevice(device)) {
          log.info('Device "%s" is now "%s"', device.id, device.type)
          tracker.emit('change', device)
        }
      })

      unfilteredTracker.on('remove', function(device) {
        if (isWantedDevice(device)) {
          log.info('Lost device "%s" (%s)', device.id, device.type)
          tracker.emit('remove', device)
        }
      })
    })

  function pushDeviceStatus(device, type) {
    push.send([wireutil.global,
      wireutil.makeDeviceStatusMessage(device.id, type, options.name)])
  }

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
      log.info('Spawning device worker "%s"', device.id)
      var ports = options.ports.splice(0, 2)
        , proc = options.fork(device, ports)

      function errorListener(err) {
        log.error('Device worker "%s" had an error: %s',
          device.id, err.message)
      }

      function exitListener(code, signal) {
        var worker = cleanupWorker(device.id)
        switch (code) {
          case 0:
            log.info('Device worker "%s" stopped cleanly', device.id)
            break
          case 143: // SIGTERM
            log.warn('Device worker "%s" was killed before becoming operational'
              , device.id)
            break
          default:
            if (Date.now() - worker.started < options.restartThreshold) {
              log.error(
                'Device worker "%s" died with exit code %d, ' +
                'NOT restarting due to threshold of %dms not being met'
              , device.id
              , code
              , options.restartThreshold
              )
            }
            else {
              log.error(
                'Device worker "%s" died with exit code %d, ' +
                'attempting to restart in %dms if device is still around'
              , device.id
              , code
              , options.restartTimeout
              )
              waitForAnyChanges(device)
                .timeout(options.restartTimeout)
                .then(function(device) {
                  // Most likely we lost the device, but our tracker didn't
                  // see it before the process died
                  log.warn(
                    'Not restarting device worker "%s" due to tracker ' +
                    'activity (but the change may cause it to start)'
                  , device.id
                  )
                })
                .catch(function() {
                  log.info('Restarting device worker "%s"', device.id)
                  maybeConnect(device)
                })
            }
            break
        }
      }

      proc.on('error', errorListener)
      proc.on('exit', exitListener)

      workers[device.id] = {
        device: device
      , proc: proc
      , started: Date.now()
      , ports: ports
      , unbind: function() {
          proc.removeListener('error', errorListener)
          proc.removeListener('exit', exitListener)
        }
      }

      counter += 1
      boast()
      return true
    }
    return false
  }

  function maybeDisconnect(device) {
    if (isConnected(device)) {
      log.info('Releasing device worker "%s"', device.id)
      gracefullyKillWorker(device.id)
      return true
    }
    return false
  }

  function waitForAnyChanges(device) {
    var resolver = Promise.defer()

    function maybeResolve(otherDevice) {
      if (otherDevice.id === device.id) {
        resolver.resolve(otherDevice)
      }
    }

    tracker.on('add', maybeResolve)
    tracker.on('change', maybeResolve)
    tracker.on('remove', maybeResolve)

    return resolver.promise.finally(function() {
      tracker.removeListener('add', maybeResolve)
      tracker.removeListener('change', maybeResolve)
      tracker.removeListener('remove', maybeResolve)
    })
  }

  function tryKillWorker(id) {
    var deferred = Promise.defer(),
        worker = workers[id]

    function onExit() {
      cleanupWorker(id)
      log.info('Gracefully killed device worker "%s"', id)
      deferred.resolve()
    }

    worker.unbind()
    worker.proc.once('exit', onExit)
    worker.proc.kill('SIGTERM')

    return deferred.promise.finally(function() {
      worker.proc.removeListener('exit', onExit)
    })
  }

  function forceKillWorker(id) {
    log.warn('Force killing device worker "%s"', id)

    var deferred = Promise.defer()
      , worker = workers[id]

    function onExit() {
      cleanupWorker(id)
      log.warn('Force killed device worker "%s"', id)
      deferred.resolve()
    }

    worker.unbind()
    worker.proc.once('exit', onExit)
    worker.proc.kill('SIGKILL')

    return deferred.promise.finally(function() {
      worker.proc.removeListener('exit', onExit)
    })
  }

  function gracefullyKillWorker(id) {
    return tryKillWorker(id)
      .timeout(options.killTimeout)
      .catch(function() {
        log.error('Device worker "%s" did not stop in time', id)
        return forceKillWorker(id)
          .timeout(options.killTimeout)
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

  function cleanupWorker(id) {
    var worker = workers[id]
    delete workers[id]
    Array.prototype.push.apply(options.ports, worker.ports)
    counter -= 1
    boast()
    return worker
  }

  function boast() {
    log.info('Providing %d device(s)', counter)
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
