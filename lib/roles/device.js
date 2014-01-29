var assert = require('assert')
var util = require('util')

var Promise = require('bluebird')
var zmq = require('zmq')
var adbkit = require('adbkit')

var logger = require('../util/logger')
var wire = require('../wire')
var wireutil = require('../util/wireutil')(wire)
var devutil = require('../util/devutil')
var pathutil = require('../util/pathutil')
var promiseutil = require('../util/promiseutil')
var Vitals = require('../util/vitals')
var ChannelManager = require('../wire/channelmanager')

module.exports = function(options) {
  var log = logger.createLogger('device')
  var identity = Object.create(null)
  var vendor = Object.create(null)
  var solo = wireutil.makePrivateChannel()
  var channels = new ChannelManager()
  var vitals = new Vitals()
  var ports = {
    http: 2870
  , input: 2820
  , stats: 2830
  , forward: 2810
  }
  var services = {
    input: null
  , monkey: null
  , logcat: null
  }

  // Show serial number in logs
  logger.setGlobalIdentifier(options.serial)

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('Sending output to %s', endpoint)
    push.connect(endpoint)
  })

  // Panic if necessary
  Promise.onPossiblyUnhandledRejection(function(err, promise) {
    log.fatal('Unhandled rejection', err.stack)
    selfDestruct()
  })

  // Forward all logs
  logger.on('entry', function(entry) {
    push.send([wireutil.global,
      wireutil.makeDeviceLogMessage(options.serial, entry)])
  })

  // Adb
  var adb = Promise.promisifyAll(adbkit.createClient())

  // Input
  var sub = zmq.socket('sub')
  options.endpoints.sub.forEach(function(endpoint) {
    log.info('Receiving input from %s', endpoint)
    sub.connect(endpoint)
  })

  // Establish always-on channels
  ;[wireutil.global, solo].forEach(function(channel) {
    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
    channels.register(channel, Infinity)
  })

  // Unsubscribe from temporary channels when they timeout
  channels.on('timeout', function(channel) {
    log.info('Channel "%s" timed out', channel)
    sub.unsubscribe(channel)
    push.send([channel, wireutil.makeLeaveGroupMessage(options.serial)])
  })

  // Closure of vital functionality
  vitals.on('end', function(name) {
    log.fatal(util.format('Vital utility "%s" has ended', name))
    selfDestruct()
  })

  // Error in vital utility
  vitals.on('error', function(name, err) {
    log.fatal(util.format('Vital utility "%s" had an error', er))
    selfDestruct()
  })

  promiseutil.periodicNotify(adb.waitBootCompleteAsync(options.serial), 1000)
    .progressed(function() {
      log.info('Waiting for boot to complete')
    })
    .then(function() {
      log.info('Gathering properties')
      return adb.getPropertiesAsync(options.serial)
    })
    .then(function(properties) {
      log.info('Solving identity')
      return identity = devutil.makeIdentity(options.serial, properties)
    })
    .then(function() {
      vendor = devutil.vendorFiles(identity)
      return Promise.all(Object.keys(vendor).map(function(id) {
        var res = vendor[id]
        log.info(util.format('Pushing vendor file "%s"', res.dest))
        return adb.pushAsync(options.serial, res.src, res.dest, res.mode)
          .then(function(transfer) {
            return new Promise(function(resolve, reject) {
              transfer.on('end', resolve)
            })
          })
      }))
    })
    .then(function() {
      log.info('Checking if any processes from a previous run are still up')
      return Promise.all([
        devutil.killProcsByComm(
          adb
        , options.serial
        , vendor.bin.comm
        , vendor.bin.dest
        )
      , devutil.killProcsByComm(
          adb
        , options.serial
        , 'commands.monkey'
        , 'com.android.commands.monkey'
        )
      ])
    })
    .then(function() {
      log.info('Launching HTTP API')
      return devutil.ensureUnusedPort(adb, options.serial, 2870)
        .then(function(port) {
          var log = logger.createLogger('device:remote:http')
          return adb.shellAsync(options.serial, [
              vendor.bin.dest
            , '--lib', vendor.lib.dest
            , '--listen-http', port
            ])
            .then(function(out) {
              vitals.register('device:remote:http:shell', out)
              out.pipe(require('split')())
                .on('data', function(chunk) {
                  log.info(chunk)
                })
            })
        })
    })
    .then(function() {
      log.info('Launching monkey service')
      return devutil.ensureUnusedPort(adb, options.serial, 1080)
        .then(function(port) {
          var log = logger.createLogger('device:remote:monkey')
          return adb.shellAsync(options.serial, [
              'monkey'
            , '--port', port
            ])
            .then(function(out) {
              vitals.register('device:remote:monkey:shell', out)
              out.pipe(require('split')())
                .on('data', function(chunk) {
                  log.info(chunk)
                })
              return port
            })
        })
        .then(function(port) {
          return devutil.waitForPort(adb, options.serial, port)
        })
        .then(function(port) {
          return adb.openMonkeyAsync(options.serial, port)
        })
        .then(function(monkey) {
          services.monkey =
            vitals.register('device:remote:monkey:monkey', monkey)
        })
    })
    .then(function() {
      log.info('Launching input service')
      return devutil.ensureUnusedPort(adb, options.serial, 2820)
        .then(function(port) {
          var log = logger.createLogger('device:remote:input')
          return adb.shellAsync(options.serial, [
              vendor.bin.dest
            , '--lib', vendor.lib.dest
            , '--listen-input', port
            ])
            .then(function(out) {
              vitals.register('device:remote:input:shell', out)
              out.pipe(require('split')())
                .on('data', function(chunk) {
                  log.info(chunk)
                })
              return port
            })
        })
        .then(function(port) {
          return devutil.waitForPort(adb, options.serial, port)
        })
        .then(function(port) {
          return adb.openMonkeyAsync(options.serial, port)
        })
        .then(function(monkey) {
          services.input =
            vitals.register('device:remote:input:monkey', monkey)
        })
    })
    .then(function() {
      log.info('Launching stats service')
      return devutil.ensureUnusedPort(adb, options.serial, 2830)
        .then(function(port) {
          var log = logger.createLogger('device:remote:stats')
          return adb.shellAsync(options.serial, [
              vendor.bin.dest
            , '--lib', vendor.lib.dest
            , '--listen-stats', port
            ])
            .then(function(out) {
              vitals.register('device:remote:stats:shell', out)
              out.pipe(require('split')())
                .on('data', function(chunk) {
                  log.info(chunk)
                })
            })
        })
    })
    .then(function() {
      log.info('Launching logcat service')
      return adb.openLogcatAsync(options.serial)
        .then(function(logcat) {
          services.logcat = vitals.register('device:logcat', logcat)
        })
    })
    .then(function() {
      log.info('Ready for instructions')
      poke()
    })
    .catch(function(err) {
      log.fatal('Setup failed', err.stack)
      selfDestruct()
    })

  sub.on('message', function(channel, data) {
    var wrapper = wire.Envelope.decode(data)
    channels.keepalive(channel)
    switch (wrapper.type) {
      case wire.MessageType.PROBE:
        var message = wire.ProbeMessage.decode(wrapper.message)
        push.send([channel,
          wireutil.makeDeviceIdentityMessage(options.serial, identity)])
        break
      case wire.MessageType.GROUP:
        var message = wire.GroupMessage.decode(wrapper.message)
          , groupChannel = message.channel
        if (wireutil.matchesRequirements(identity, message.requirements)) {
          channels.register(groupChannel, message.timeout)
          log.info('Subscribing to group channel "%s"', groupChannel)
          sub.subscribe(groupChannel)
          push.send([groupChannel,
            wireutil.makeJoinGroupMessage(options.serial)])
        }
        break
      case wire.MessageType.SHELL_COMMAND:
        var message = wire.ShellCommandMessage.decode(wrapper.message)
        log.info('Running shell command "%s"', message.command.join(' '))
        adb.shellAsync(options.serial, message.command)
          .then(function(stream) {
            var resolver = Promise.defer()
              , seq = 0

            function dataListener(chunk) {
              push.send([message.channel,
                wireutil.makeDeviceDataMessage(
                  options.serial
                , seq++
                , chunk
                )])
            }

            function endListener() {
              push.send([message.channel,
                wireutil.makeDeviceDoneMessage(options.serial)])
              resolver.resolve()
            }

            function errorListener(err) {
              log.error('Shell command "%s" failed due to "%s"'
                , message.command.join(' '), err.message)
              resolver.reject(err)
              push.send([message.channel,
                wireutil.makeDeviceFailMessage(
                  options.serial
                , err.message
                )])
            }

            stream.on('data', dataListener)
            stream.on('end', endListener)
            stream.on('error', errorListener)

            return resolver.promise.finally(function() {
              stream.removeListener('data', dataListener)
              stream.removeListener('end', endListener)
              stream.removeListener('error', errorListener)
            })
          })
          .error(function(err) {
            log.error('Shell command "%s" failed due to "%s"'
                , message.command.join(' '), err.message)
            push.send([message.channel,
              wire.makeDeviceFailMessage(options.serial, err.message)])
          })
        break
    }
  })

  function poke() {
    push.send([wireutil.global,
      wireutil.makeDevicePokeMessage(options.serial, solo)])
  }

  function selfDestruct() {
    process.exit(1)
  }

  function gracefullyExit() {
    log.info('Bye')
    process.exit(0)
  }

  process.on('SIGINT', function() {
    gracefullyExit()
  })

  process.on('SIGTERM', function() {
    gracefullyExit()
  })
}
