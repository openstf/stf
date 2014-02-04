var path = require('path')
var events = require('events')

var adb = require('adbkit')
var Promise = require('bluebird')
var zmq = require('zmq')
var _ = require('lodash')

var logger = require('../util/logger')
var wire = require('../wire')
var wireutil = require('../wire/util')
var procutil = require('../util/procutil')

module.exports = function(options) {
  var log = logger.createLogger('provider')
  var client = Promise.promisifyAll(adb.createClient())
  var workers = {}
  var lists = {
    all: []
  , ready: []
  , waiting: []
  }

  // Information about total devices
  var delayedTotals = (function() {
    var timer

    function totals() {
      if (lists.waiting.length) {
        log.info(
          'Providing %d of %d device(s), and still waiting for "%s"'
        , lists.ready.length
        , lists.all.length
        , lists.waiting.join('", "')
        )

        delayedTotals()
      }
      else {
        log.info(
          'Providing all %d of %d device(s)'
        , lists.ready.length
        , lists.all.length
        )
      }
    }

    return function() {
      clearTimeout(timer)
      timer = setTimeout(totals, 10000)
    }
  })()

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('Sending output to %s', endpoint)
    push.connect(endpoint)
  })

  // Track and manage devices
  client.trackDevicesAsync().then(function(tracker) {
    log.info('Tracking devices')

    // Helper for ignoring unwanted devices
    function filterDevice(listener) {
      if (options.filter) {
        return function(device) {
          if (options.filter(device)) {
            listener(device)
          }
        }
      }
      return listener
    }

    // To make things easier, we're going to cheat a little, and make all
    // device events go to their own EventEmitters. This way we can keep all
    // device data in the same scope.
    var flippedTracker = new events.EventEmitter()

    tracker.on('add', filterDevice(function(device) {
      log.info('Found device "%s" (%s)', device.id, device.type)

      // Tell others we found a device
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.DevicePresentMessage(
          device.id
        , options.name
        , wireutil.toDeviceStatus(device.type)
        ))
      ])

      // Statistics
      lists.all.push(device.id)
      delayedTotals()

      var privateTracker = new events.EventEmitter()
        , resolver = Promise.defer()
        , timer
        , worker

      // When any event occurs on the added device
      function deviceListener(type, device) {
        // Okay, this is a bit unnecessary but it allows us to get rid of an
        // ugly switch statement and return to the original style.
        privateTracker.emit(type, device)
      }

      // When the added device changes
      function changeListener(device) {
        log.info('Device "%s" is now "%s"', device.id, device.type)

        // Tell others the device changed
        push.send([
          wireutil.global
        , wireutil.envelope(new wire.DeviceStatusMessage(
            device.id
          , wireutil.toDeviceStatus(device.type)
          ))
        ])

        check(device)
      }

      // When the added device gets removed
      function removeListener(device) {
        log.info('Lost device "%s" (%s)', device.id, device.type)

        clearTimeout(timer)
        flippedTracker.removeListener(device.id, deviceListener)
        _.pull(lists.all, device.id)
        delayedTotals()

        // Tell others the device is gone
        push.send([
          wireutil.global
        , wireutil.envelope(new wire.DeviceAbsentMessage(
            device.id
          ))
        ])

        stop()
      }

      // Check if we can do anything with the device
      function check(device) {
        clearTimeout(timer)
        switch (device.type) {
          case 'device':
          case 'emulator':
            timer = setTimeout(work, 100)
            break
          default:
            stop()
            break
        }
      }

      // Starts a device worker and keeps it alive
      function work() {
        return worker = workers[device.id] = spawn(device)
          .then(function() {
            log.info('Device worker "%s" has retired', device.id)
            worker = workers[device.id] = null
          })
          .catch(procutil.ExitError, function(err) {
            log.info('Restarting device worker "%s"', device.id)
            return Promise.delay(500)
              .then(function() {
                return work()
              })
          })
      }

      // No more work required
      function stop() {
        if (worker) {
          log.info('Shutting down device worker "%s"', device.id)
          worker.cancel()
        }
      }

      // Spawn a device worker
      function spawn(device) {
        var ports = options.ports.splice(0, 2)
          , proc = options.fork(device, ports)
          , resolver = Promise.defer()

        function exitListener(code, signal) {
          if (signal) {
            log.warn(
              'Device worker "%s" was killed with signal %s, assuming ' +
              'deliberate action and not restarting'
            , device.id
            , signal
            )
            resolver.resolve()
          }
          else if (code === 0) {
            log.info('Device worker "%s" stopped cleanly', device.id)
            resolver.resolve()
          }
          else {
            log.error(
              'Device worker "%s" died with code %s'
            , device.id
            , code
            )
            resolver.reject(new procutil.ExitError(code))
          }
        }

        function errorListener(err) {
          log.error(
            'Device worker "%s" had an error: %s'
          , device.id
          , err.message
          )
        }

        function messageListener(message) {
          switch (message) {
            case 'ready':
              _.pull(lists.waiting, device.id)
              lists.ready.push(device.id)
              break
            default:
              log.warn(
                'Unknown message from device worker "%s": "%s"'
              , device.id
              , message
              )
              break
          }
        }

        proc.on('exit', exitListener)
        proc.on('error', errorListener)
        proc.on('message', messageListener)

        return resolver.promise
          .finally(function() {
            log.info('Cleaning up device worker "%s"', device.id)

            proc.removeListener('exit', exitListener)
            proc.removeListener('error', errorListener)
            proc.removeListener('message', messageListener)

            // Return used ports to the main pool
            Array.prototype.push.apply(options.ports, ports)

            // Update lists
            _.pull(lists.ready, device.id)
            _.pull(lists.waiting, device.id)
          })
          .cancellable()
          .catch(Promise.CancellationError, function(err) {
            log.info('Gracefully killing device worker "%s"', device.id)
            return procutil.gracefullyKill(proc, options.killTimeout)
          })
          .catch(Promise.TimeoutError, function(err) {
            log.error(
              'Device worker "%s" did not stop in time: %s'
            , device.id
            , err.message
            )
          })
      }

      flippedTracker.on(device.id, deviceListener)
      privateTracker.on('change', changeListener)
      privateTracker.on('remove', removeListener)
      check(device)
    }))

    tracker.on('change', filterDevice(function(device) {
      flippedTracker.emit(device.id, 'change', device)
    }))

    tracker.on('remove', filterDevice(function(device) {
      flippedTracker.emit(device.id, 'remove', device)
    }))
  })

  function gracefullyExit() {
    log.info('Stopping all workers')
    Promise.all(Object.keys(workers).map(function(serial) {
        return workers[serial].cancel()
      }))
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
