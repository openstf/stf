var path = require('path')
var fork = require('child_process').fork

var adb = require('adbkit')
var async = require('async')

var log = require('./util/logger').createLogger('provider')
var client = adb.createClient()
var workers = {}

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
  return workers[device.id] && workers[device.id].proc
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

function gracefullyKillWorker(id, done) {
  var proc = workers[id].proc
    , timer

  timer = setTimeout(function() {
    log.error('Device worker "%s" did not stop in time', id)
    proc.removeListener('exit', onExit)
    log.warn('Force killing worker of device "%s"', id)
    proc.kill('SIGKILL')
    done()
  }, 10000)

  function onExit() {
    clearTimeout(timer)
    done()
  }

  proc.once('exit', onExit)
  proc.kill('SIGTERM')
}

function gracefullyExit() {
  log.info('Stopping all workers')
  async.each(Object.keys(workers), gracefullyKillWorker, function(err) {
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
