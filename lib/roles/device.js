var assert = require('assert')
var util = require('util')
var http = require('http')

var Promise = require('bluebird')
var zmq = require('zmq')
var adbkit = require('adbkit')
var monkey = require('adbkit-monkey')
var request = Promise.promisifyAll(require('request'))
var httpProxy = require('http-proxy')
var split = require('split')

var logger = require('../util/logger')
var wire = require('../wire')
var wireutil = require('../wire/util')
var wirerouter = require('../wire/router')
var devutil = require('../util/devutil')
var pathutil = require('../util/pathutil')
var promiseutil = require('../util/promiseutil')
var Vitals = require('../util/vitals')
var ChannelManager = require('../wire/channelmanager')

module.exports = function(options) {
  var log = logger.createLogger('device')
    , identity = Object.create(null)
    , display = Object.create(null)
    , vendor = Object.create(null)
    , owner = null
    , solo = wireutil.makePrivateChannel()
    , channels = new ChannelManager()
    , vitals = new Vitals()
    , ports = {
        http: 2870
      , input: 2820
      , stats: 2830
      , forward: 2810
      }
    , services = {
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
    push.send([wireutil.log,
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
    if (channel === owner.group) {
      leaveGroup()
    }
  })

  // Closure of vital functionality
  vitals.on('end', function(name) {
    log.fatal(util.format('Vital utility "%s" has ended', name))
    selfDestruct()
  })

  // Error in vital utility
  vitals.on('error', function(name, err) {
    log.fatal(util.format('Vital utility "%s" had an error', err.stack))
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
              out.pipe(split())
                .on('data', function(chunk) {
                  log.info(chunk)
                })
            })
            .then(function() {
              return devutil.waitForPort(adb, options.serial, port)
            })
            .then(function(conn) {
              var ours = options.ports.pop()
                , everyones = options.ports.pop()
                , url = util.format('http://127.0.0.1:%d', ours)

              // Don't need the connection
              conn.end()

              log.info('Opening device HTTP API forwarder on "%s"', url)

              return adb.forwardAsync(
                  options.serial
                , util.format('tcp:%d', ours)
                , util.format('tcp:%d', port)
                )
                .then(function() {
                  return request.getAsync({
                    url: util.format('%s/api/v1/displays/0', url)
                  , json: true
                  })
                })
                .then(function(args) {
                  assert.ok('id' in args[1], 'Invalid response from HTTP API')
                  identity.display = args[1]
                })
                .then(function() {
                  log.info(
                    'Opening HTTP API proxy on "http://%s:%s"'
                  , options.publicIp
                  , everyones
                  )

                  var resolver = Promise.defer()

                  function resolve() {
                    vitals.register('device:http:proxy', proxyServer)
                    resolver.resolve()
                  }

                  function reject(err) {
                    resolver.reject(err)
                  }

                  var proxy = httpProxy.createProxyServer({
                    target: url
                  , ws: false
                  , xfwd: false
                  })

                  var proxyServer = http.createServer(proxy.web)
                    .listen(everyones)

                  proxyServer.on('listening', resolve)
                  proxyServer.on('error', reject)

                  return resolver.promise.finally(function() {
                    proxyServer.removeListener('listening', resolve)
                    proxyServer.removeListener('error', reject)
                  })
                })
                .then(function() {
                  identity.display.url = util.format(
                    'http://%s:%s/api/v1/displays/0/screenshot.jpg'
                  , options.publicIp
                  , everyones
                  )
                })
            })
        })
    })
    .then(function() {
      log.info('Launching monkey service')
      return devutil.ensureUnusedPort(adb, options.serial, 1080)
        .then(function(port) {
          var log = logger.createLogger('device:remote:monkey')
          return adb.shellAsync(options.serial, util.format(
              // Some devices fail without an SD card installed; we can
              // fake an external storage using this method
              'EXTERNAL_STORAGE=/data/local/tmp monkey --port %d'
            , port
            ))
            .then(function(out) {
              vitals.register('device:remote:monkey:shell', out)
              out.pipe(split())
                .on('data', function(chunk) {
                  log.info(chunk)
                })
              return port
            })
        })
        .then(function(port) {
          return devutil.waitForPort(adb, options.serial, port)
        })
        .then(function(conn) {
          return monkey.connectStream(conn)
        })
        .then(function(monkey) {
          services.monkey = vitals.register(
            'device:remote:monkey:monkey'
          , Promise.promisifyAll(monkey)
          )
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
              out.pipe(split())
                .on('data', function(chunk) {
                  log.info(chunk)
                })
              return port
            })
        })
        .then(function(port) {
          return devutil.waitForPort(adb, options.serial, port)
        })
        .then(function(conn) {
          return monkey.connectStream(conn)
        })
        .then(function(monkey) {
          services.input = vitals.register(
            'device:remote:input:monkey'
          , Promise.promisifyAll(monkey)
          )
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
              out.pipe(split())
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
      process.send('ready')
      poke()
    })
    .catch(function(err) {
      log.fatal('Setup failed', err.stack)
      selfDestruct()
    })

  sub.on('message', wirerouter()
    .on(wire.ProbeMessage, function(channel, message) {
      push.send([wireutil.global,
        wireutil.makeDeviceIdentityMessage(options.serial, identity)])
      channels.keepalive(channel)
    })
    .on(wire.GroupMessage, function(channel, message) {
      if (!isGrouped() &&
          devutil.matchesRequirements(identity, message.requirements)) {
        joinGroup(message.owner, message.timeout)
      }
      channels.keepalive(channel)
    })
    .on(wire.UngroupMessage, function(channel, message) {
      if (isGrouped() &&
          devutil.matchesRequirements(identity, message.requirements)) {
        leaveGroup()
      }
      channels.keepalive(channel)
    })
    .on(wire.TouchDownMessage, function(channel, message) {
      services.input.touchDownAsync(message.x, message.y)
        .catch(function(err) {
          log.error('touchDown failed', err.stack)
        })
    })
    .on(wire.TouchMoveMessage, function(channel, message) {
      services.input.touchMoveAsync(message.x, message.y)
        .catch(function(err) {
          log.error('touchMove failed', err.stack)
        })
    })
    .on(wire.TouchUpMessage, function(channel, message) {
      services.input.touchUpAsync(message.x, message.y)
        .catch(function(err) {
          log.error('touchUp failed', err.stack)
        })
    })
    .on(wire.TapMessage, function(channel, message) {
      services.input.tapAsync(message.x, message.y)
        .catch(function(err) {
          log.error('tap failed', err.stack)
        })
    })
    .on(wire.TypeMessage, function(channel, message) {
      services.monkey.typeAsync(message.text)
        .catch(function(err) {
          log.error('type failed', err.stack)
        })
    })
    .on(wire.KeyDownMessage, function(channel, message) {
      services.monkey.keyDownAsync(message.key)
        .catch(function(err) {
          log.error('keyDown failed', err.stack)
        })
    })
    .on(wire.KeyUpMessage, function(channel, message) {
      services.monkey.keyUpAsync(message.key)
        .catch(function(err) {
          log.error('keyUp failed', err.stack)
        })
    })
    .on(wire.KeyPressMessage, function(channel, message) {
      services.monkey.pressAsync(message.key)
        .catch(function(err) {
          log.error('keyPress failed', err.stack)
        })
    })
    .on(wire.LogcatApplyFiltersMessage, function(channel, message) {
      services.logcat.resetFilters().excludeAll()
      message.filters.forEach(function(filter) {
        services.logcat.include(filter.tag, filter.priority)
      })
    })
    .on(wire.ShellCommandMessage, function(channel, message) {
      log.info('Running shell command "%s"', message.command.join(' '))
      adb.shellAsync(options.serial, message.command)
        .then(function(stream) {
          var resolver = Promise.defer()
            , seq = 0

          function dataListener(chunk) {
            push.send([message.channel,
              wireutil.makeShellCommandDataMessage(
                options.serial
              , seq++
              , chunk
              )])
          }

          function endListener() {
            push.send([message.channel,
              wireutil.makeShellCommandDoneMessage(options.serial)])
            resolver.resolve()
          }

          function errorListener(err) {
            log.error('Shell command "%s" failed due to "%s"'
              , message.command.join(' '), err.message)
            resolver.reject(err)
            push.send([message.channel,
              wireutil.makeShellCommandFailMessage(
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
            wire.makeShellCommandFailMessage(options.serial, err.message)])
        })
      channels.keepalive(channel)
    })
    .handler())

  function poke() {
    push.send([
      wireutil.global
    , wireutil.envelope(new wire.DevicePokeMessage(
        options.serial
      , solo
      ))
    ])
  }

  function isGrouped() {
    return !!owner
  }

  function joinGroup(newOwner, timeout) {
    log.info('Now owned by "%s"', newOwner.email)
    log.info('Subscribing to group channel "%s"', newOwner.group)
    channels.register(newOwner.group, timeout)
    sub.subscribe(newOwner.group)
    push.send([
      wireutil.global
    , wireutil.envelope(new wire.JoinGroupMessage(
        options.serial
      , newOwner
      ))
    ])
    owner = newOwner
  }

  function leaveGroup() {
    log.info('No longer owned by "%s"', owner.email)
    log.info('Unsubscribing from group channel "%s"', owner.group)
    channels.unregister(owner.group)
    sub.unsubscribe(owner.group)
    push.send([
      wireutil.global
    , wireutil.envelope(new wire.LeaveGroupMessage(
        options.serial
      , owner
      ))
    ])
    owner = null
  }

  function selfDestruct() {
    process.exit(1)
  }

  function gracefullyExit() {
    if (isGrouped()) {
      leaveGroup()
      Promise.delay(500).then(gracefullyExit)
    }
    else {
      log.info('Bye')
      process.exit(0)
    }
  }

  process.on('SIGINT', function() {
    gracefullyExit()
  })

  process.on('SIGTERM', function() {
    gracefullyExit()
  })
}
