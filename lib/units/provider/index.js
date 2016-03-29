var adb = require('adbkit')
var Promise = require('bluebird')
var _ = require('lodash')
var EventEmitter = require('eventemitter3').EventEmitter

var logger = require('../../util/logger')
var wire = require('../../wire')
var wireutil = require('../../wire/util')
var wirerouter = require('../../wire/router')
var procutil = require('../../util/procutil')
var lifecycle = require('../../util/lifecycle')
var srv = require('../../util/srv')
var zmqutil = require('../../util/zmqutil')

module.exports = function(options) {
  var log = logger.createLogger('provider')
  var client = adb.createClient({
    host: options.adbHost
  , port: options.adbPort
  })
  var workers = {}
  var solo = wireutil.makePrivateChannel()
  var lists = {
    all: []
  , ready: []
  , waiting: []
  }
  var totalsTimer

  // To make sure that we always bind the same type of service to the same
  // port, we must ensure that we allocate ports in fixed groups.
  var ports = options.ports.slice(
    0
  , options.ports.length - options.ports.length % 4
  )

  // Information about total devices
  var delayedTotals = (function() {
    function totals() {
      if (lists.waiting.length) {
        log.info(
          'Providing %d of %d device(s); waiting for "%s"'
        , lists.ready.length
        , lists.all.length
        , lists.waiting.join('", "')
        )

        delayedTotals()
      }
      else if (lists.ready.length < lists.all.length) {
        log.info(
          'Providing all %d of %d device(s); ignoring "%s"'
        , lists.ready.length
        , lists.all.length
        , _.difference(lists.all, lists.ready).join('", "')
        )
      }
      else {
        log.info(
          'Providing all %d device(s)'
        , lists.all.length
        )
      }
    }

    return function() {
      clearTimeout(totalsTimer)
      totalsTimer = setTimeout(totals, 10000)
    }
  })()

  // Output
  var push = zmqutil.socket('push')
  Promise.map(options.endpoints.push, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Sending output to "%s"', record.url)
        push.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to push endpoint', err)
    lifecycle.fatal()
  })

  // Input
  var sub = zmqutil.socket('sub')
  Promise.map(options.endpoints.sub, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Receiving input from "%s"', record.url)
        sub.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to sub endpoint', err)
    lifecycle.fatal()
  })

  // Establish always-on channels
  ;[solo].forEach(function(channel) {
    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
  })

  // Track and manage devices
  client.trackDevices().then(function(tracker) {
    log.info('Tracking devices')

    // This can happen when ADB doesn't have a good connection to
    // the device
    function isWeirdUnusableDevice(device) {
      return device.id === '????????????'
    }

    // Check whether the device is remote (i.e. if we're connecting to
    // an IP address (or hostname) and port pair).
    function isRemoteDevice(device) {
      return device.id.indexOf(':') !== -1
    }

    // Helper for ignoring unwanted devices
    function filterDevice(listener) {
      return function(device) {
        if (isWeirdUnusableDevice(device)) {
          log.warn('ADB lists a weird device: "%s"', device.id)
          return false
        }
        if (!options.allowRemote && isRemoteDevice(device)) {
          log.info(
            'Filtered out remote device "%s", use --allow-remote to override'
          , device.id
          )
          return false
        }
        if (options.filter && !options.filter(device)) {
          log.info('Filtered out device "%s"', device.id)
          return false
        }
        return listener(device)
      }
    }

    // To make things easier, we're going to cheat a little, and make all
    // device events go to their own EventEmitters. This way we can keep all
    // device data in the same scope.
    var flippedTracker = new EventEmitter()

    tracker.on('add', filterDevice(function(device) {
      log.info('Found device "%s" (%s)', device.id, device.type)

      var privateTracker = new EventEmitter()
      var willStop = false
      var timer, worker

      // Wait for others to acknowledge the device
      var register = new Promise(function(resolve) {
        // Tell others we found a device
        push.send([
          wireutil.global
        , wireutil.envelope(new wire.DeviceIntroductionMessage(
            device.id
          , wireutil.toDeviceStatus(device.type)
          , new wire.ProviderMessage(
              solo
            , options.name
            )
          ))
        ])

        privateTracker.once('register', resolve)
      })


      // Spawn a device worker
      function spawn() {
        var allocatedPorts = ports.splice(0, 4)
        var proc = options.fork(device, allocatedPorts.slice())
        var resolver = Promise.defer()

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

        lists.waiting.push(device.id)

        return resolver.promise
          .cancellable()
          .finally(function() {
            log.info('Cleaning up device worker "%s"', device.id)

            proc.removeListener('exit', exitListener)
            proc.removeListener('error', errorListener)
            proc.removeListener('message', messageListener)

            // Return used ports to the main pool
            Array.prototype.push.apply(ports, allocatedPorts)

            // Update lists
            _.pull(lists.ready, device.id)
            _.pull(lists.waiting, device.id)
          })
          .catch(Promise.CancellationError, function() {
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

      // Starts a device worker and keeps it alive
      function work() {
        return (worker = workers[device.id] = spawn())
          .then(function() {
            log.info('Device worker "%s" has retired', device.id)
            delete workers[device.id]
            worker = null

            // Tell others the device is gone
            push.send([
              wireutil.global
              , wireutil.envelope(new wire.DeviceAbsentMessage(
                device.id
              ))
            ])
          })
          .catch(procutil.ExitError, function(err) {
            if (!willStop) {
              log.error(
                'Device worker "%s" died with code %s'
                , device.id
                , err.code
              )
              log.info('Restarting device worker "%s"', device.id)
              return Promise.delay(500)
                .then(function() {
                  return work()
                })
            }
          })
      }

      // No more work required
      function stop() {
        if (worker) {
          log.info('Shutting down device worker "%s"', device.id)
          worker.cancel()
        }
      }

      // Check if we can do anything with the device
      function check() {
        clearTimeout(timer)

        if (device.present) {
          // We might get multiple status updates in rapid succession,
          // so let's wait for a while
          switch (device.type) {
            case 'device':
            case 'emulator':
              willStop = false
              timer = setTimeout(work, 100)
              break
            default:
              willStop = true
              timer = setTimeout(stop, 100)
              break
          }
        }
        else {
          stop()
        }
      }

      register.then(function() {
        log.info('Registered device "%s"', device.id)
        check()
      })

      // Statistics
      lists.all.push(device.id)
      delayedTotals()

      // Will be set to false when the device is removed
      _.assign(device, {
        present: true
      })

      // When any event occurs on the added device
      function deviceListener(type, updatedDevice) {
        // Okay, this is a bit unnecessary but it allows us to get rid of an
        // ugly switch statement and return to the original style.
        privateTracker.emit(type, updatedDevice)
      }

      // When the added device changes
      function changeListener(updatedDevice) {
        register.then(function() {
          log.info(
            'Device "%s" is now "%s" (was "%s")'
          , device.id
          , updatedDevice.type
          , device.type
          )

          _.assign(device, {
            type: updatedDevice.type
          })

          // Tell others the device changed
          push.send([
            wireutil.global
          , wireutil.envelope(new wire.DeviceStatusMessage(
              device.id
            , wireutil.toDeviceStatus(device.type)
            ))
          ])

          check()
        })
      }

      // When the added device gets removed
      function removeListener() {
        register.then(function() {
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

          _.assign(device, {
            present: false
          })

          check()
        })
      }

      flippedTracker.on(device.id, deviceListener)
      privateTracker.on('change', changeListener)
      privateTracker.on('remove', removeListener)
    }))

    tracker.on('change', filterDevice(function(device) {
      flippedTracker.emit(device.id, 'change', device)
    }))

    tracker.on('remove', filterDevice(function(device) {
      flippedTracker.emit(device.id, 'remove', device)
    }))

    sub.on('message', wirerouter()
      .on(wire.DeviceRegisteredMessage, function(channel, message) {
        flippedTracker.emit(message.serial, 'register')
      })
      .handler())

    lifecycle.share('Tracker', tracker)
  })

  lifecycle.observe(function() {
    [push, sub].forEach(function(sock) {
      try {
        sock.close()
      }
      catch (err) {
        // No-op
      }
    })

    clearTimeout(totalsTimer)

    return Promise.all(Object.keys(workers).map(function(serial) {
      return workers[serial].cancel()
    }))
  })
}
