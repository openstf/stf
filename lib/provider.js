var path = require('path')
var fork = require('child_process').fork

var adb = require('adbkit')
var Q = require('q')

var log = require('./util/logger').createLogger('provider')
var client = adb.createClient()
var workers = Object.create(null)

client.trackDevices(function(err, tracker) {
  if (err) {
    log.fatal('Unable to track devices: %s', err.message)
    throw err
  }

  log.info('Tracking devices')

  tracker.on('add', function(device) {
    log.info('Found device "%s" (%s)', device.id, device.type)
    maybeConnect(device)
  })

  tracker.on('change', function(device) {
    log.info('Device "%s" is now "%s"', device.id, device.type)
    maybeConnect(device) || maybeDisconnect(device)
  })

  tracker.on('remove', function(device) {
    log.info('Lost device "%s" (%s)', device.id, device.type)
    maybeDisconnect(device)
  })
})

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
    var proc = fork(path.join(__dirname, 'device'), {
      env: {
        ANDROID_SERIAL: device.id
      }
    })
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
  var deferred = Q.defer(),
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

  var deferred = Q.defer()
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
  var deferred = Q.defer()

  tryKillWorker(id)
    .timeout(10000)
    .then(deferred.resolve)
    .catch(function() {
      log.error('Device worker "%s" did not stop in time', id)
      forceKillWorker(id).then(deferred.resolve)
    })

  return deferred.promise
}

function gracefullyExit() {
  log.info('Stopping all workers')
  Q.spawn(function* foo() {
    var ops = []
    for (var id in workers) {
      ops.push(gracefullyKillWorker(id))
    }
    yield Q.all(ops)
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
