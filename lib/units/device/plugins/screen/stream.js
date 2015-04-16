var util = require('util')

var Promise = require('bluebird')
var syrup = require('stf-syrup')
var WebSocketServer = require('ws').Server
var uuid = require('node-uuid')
var EventEmitter = require('eventemitter3').EventEmitter
var split = require('split')
var adbkit = require('adbkit')

var logger = require('../../../../util/logger')
var lifecycle = require('../../../../util/lifecycle')
var bannerutil = require('./util/banner')
var FrameParser = require('./util/frameparser')
var FrameConfig = require('./util/frameconfig')
var BroadcastSet = require('./util/broadcastset')
var StateQueue = require('./util/statequeue')
var RiskyStream = require('./util/riskystream')

module.exports = syrup.serial()
  .dependency(require('../../support/adb'))
  .dependency(require('../../resources/minicap'))
  .dependency(require('../display'))
  .dependency(require('./options'))
  .define(function(options, adb, minicap, display, screenOptions) {
    var log = logger.createLogger('device:plugins:screen:stream')
    var plugin = Object.create(null)

    function FrameProducer(config) {
      this.actionQueue = []
      this.runningState = FrameProducer.STATE_STOPPED
      this.desiredState = new StateQueue()
      this.output = null
      this.socket = null
      this.banner = null
      this.frameConfig = config
    }

    util.inherits(FrameProducer, EventEmitter)

    FrameProducer.STATE_STOPPED = 1
    FrameProducer.STATE_STARTING = 2
    FrameProducer.STATE_STARTED = 3
    FrameProducer.STATE_STOPPING = 4

    FrameProducer.prototype._ensureState = function() {
      switch (this.runningState) {
      case FrameProducer.STATE_STARTING:
      case FrameProducer.STATE_STOPPING:
        // Just wait.
        break
      case FrameProducer.STATE_STOPPED:
        if (this.desiredState.next() === FrameProducer.STATE_STARTED) {
          this.runningState = FrameProducer.STATE_STARTING
          this._startService().bind(this)
            .then(function(out) {
              this.output = new RiskyStream(out)
                .on('unexpectedEnd', this._outputEnded.bind(this))
              return this._readOutput(this.output.stream)
            })
            .then(function() {
              return this._connectService()
            })
            .then(function(socket) {
              this.socket = new RiskyStream(socket)
                .on('unexpectedEnd', this._socketEnded.bind(this))
              return this._readBanner(this.socket.stream)
            })
            .then(function(banner) {
              this.banner = banner
              return this._readFrames()
            })
            .then(function() {
              this.runningState = FrameProducer.STATE_STARTED
              this.emit('start')
            })
            .catch(function(err) {
              this.runningState = FrameProducer.STATE_STOPPED
              this.emit('error', err)
            })
            .finally(function() {
              this._ensureState()
            })
        }
        break
      case FrameProducer.STATE_STARTED:
        if (this.desiredState.next() === FrameProducer.STATE_STOPPED) {
          this.runningState = FrameProducer.STATE_STOPPING
          this._disconnectService(this.socket).bind(this)
            .timeout(2000)
            .then(function() {
              return this._stopService(this.output).timeout(10000)
            })
            .then(function() {
              this.runningState = FrameProducer.STATE_STOPPED
              this.emit('stop')
            })
            .catch(function(err) {
              // In practice we _should_ never get here due to _stopService()
              // being quite aggressive. But if we do, well... assume it
              // stopped anyway for now.
              this.runningState = FrameProducer.STATE_STOPPED
              this.emit('error', err)
              this.emit('stop')
            })
            .finally(function() {
              this.output = null
              this.socket = null
              this.banner = null
              this._ensureState()
            })
        }
        break
      }
    }

    FrameProducer.prototype.start = function() {
      log.info('Requesting frame producer to start')
      this.desiredState.push(FrameProducer.STATE_STARTED)
      this._ensureState()
    }

    FrameProducer.prototype.stop = function() {
      log.info('Requesting frame producer to stop')
      this.desiredState.push(FrameProducer.STATE_STOPPED)
      this._ensureState()
    }

    FrameProducer.prototype.restart = function() {
      switch (this.runningState) {
      case FrameProducer.STATE_STARTED:
      case FrameProducer.STATE_STARTING:
        this.desiredState.push(FrameProducer.STATE_STOPPED)
        this.desiredState.push(FrameProducer.STATE_STARTED)
        this._ensureState()
        break
      }
    }

    FrameProducer.prototype.updateRotation = function(rotation) {
      if (this.frameConfig.rotation === rotation) {
        log.info('Keeping %d as current frame producer rotation', rotation)
        return
      }

      log.info('Setting frame producer rotation to %d', rotation)
      this.frameConfig.rotation = rotation
      this._configChanged()
    }

    FrameProducer.prototype.updateProjection = function(width, height) {
      if (this.frameConfig.virtualWidth === width &&
          this.frameConfig.virtualHeight === height) {
        log.info(
          'Keeping %dx%d as current frame producer projection', width, height)
        return
      }

      log.info('Setting frame producer projection to %dx%d', width, height)
      this.frameConfig.virtualWidth = width
      this.frameConfig.virtualHeight = height
      this._configChanged()
    }

    FrameProducer.prototype._configChanged = function() {
      this.restart()
    }

    FrameProducer.prototype._socketEnded = function() {
      log.warn('Connection to minicap ended unexpectedly')
      this.restart()
    }

    FrameProducer.prototype._outputEnded = function() {
      log.warn('Shell keeping minicap running ended unexpectedly')
      this.restart()
    }

    FrameProducer.prototype._startService = function() {
      log.info('Launching screen service')
      return minicap.run(util.format('-S -P %s', this.frameConfig.toString()))
        .timeout(10000)
    }

    FrameProducer.prototype._readOutput = function(out) {
      out.pipe(split()).on('data', function(line) {
        var trimmed = line.toString().trim()

        if (trimmed === '') {
          return
        }

        if (/ERROR/.test(line)) {
          log.fatal('minicap error: "%s"', line)
          return lifecycle.fatal()
        }

        log.info('minicap says: "%s"', line)
      })
    }

    FrameProducer.prototype._connectService = function() {
      function tryConnect(times, delay) {
        return adb.openLocal(options.serial, 'localabstract:minicap')
          .timeout(10000)
          .then(function(out) {
            return out
          })
          .catch(function(err) {
            if (/closed/.test(err.message) && times > 1) {
              return Promise.delay(delay)
                .then(function() {
                  return tryConnect(--times, delay * 2)
                })
            }
            return Promise.reject(err)
          })
      }
      log.info('Connecting to minicap service')
      return tryConnect(5, 100)
    }

    FrameProducer.prototype._disconnectService = function(socket) {
      log.info('Disconnecting from minicap service')

      if (!socket || socket.ended) {
        return Promise.resolve(true)
      }

      var endListener
      return new Promise(function(resolve/*, reject*/) {
          socket.on('end', endListener = function() {
            resolve(true)
          })

          socket.end()
        })
        .finally(function() {
          socket.removeListener('end', endListener)
        })
    }

    FrameProducer.prototype._stopService = function(output) {
      log.info('Stopping minicap service')

      if (!output || output.ended) {
        return Promise.resolve(true)
      }

      var pid = this.banner ? this.banner.pid : -1

      function waitForEnd() {
        var endListener
        return new Promise(function(resolve/*, reject*/) {
            output.expectEnd().on('end', endListener = function() {
              resolve(true)
            })
          })
          .finally(function() {
            output.removeListener('end', endListener)
          })
      }

      function kindKill() {
        if (pid <= 0) {
          return Promise.reject(new Error('Minicap service pid is unknown'))
        }

        log.info('Sending SIGTERM to minicap')
        return Promise.all([
          waitForEnd()
        , adb.shell(options.serial, ['kill', pid])
            .then(adbkit.util.readAll)
            .timeout(2000)
            .return(true)
        ])
      }

      function forceKill() {
        if (pid <= 0) {
          return Promise.reject(new Error('Minicap service pid is unknown'))
        }

        log.info('Sending SIGKILL to minicap')
        return Promise.all([
          waitForEnd()
        , adb.shell(options.serial, ['kill', '-9', pid])
            .then(adbkit.util.readAll)
            .timeout(2000)
            .return(true)
        ])
      }

      function forceEnd() {
        log.info('Ending minicap I/O as a last resort')
        output.end()
        return Promise.resolve(true)
      }

      return kindKill()
        .catch(Promise.TimeoutError, forceKill)
        .catch(forceEnd)
    }

    FrameProducer.prototype._readBanner = function(out) {
      log.info('Reading minicap banner')
      return bannerutil.read(out).timeout(2000)
    }

    FrameProducer.prototype._readFrames = function() {
      var parser = this.socket.stream.pipe(new FrameParser())
      var emit = this.emit.bind(this)

      function tryRead() {
        for (var frame; (frame = parser.read());) {
          emit('frame', frame)
        }
      }

      tryRead()
      parser.on('readable', tryRead)
    }

    function createServer() {
      log.info('Starting WebSocket server on port %d', screenOptions.publicPort)

      var wss = new WebSocketServer({
        port: screenOptions.publicPort
      , perMessageDeflate: false
      })

      var listeningListener, errorListener
      return new Promise(function(resolve, reject) {
          listeningListener = function() {
            return resolve(wss)
          }

          errorListener = function(err) {
            return reject(err)
          }

          wss.on('listening', listeningListener)
          wss.on('error', errorListener)
        })
        .finally(function() {
          wss.removeListener('listening', listeningListener)
          wss.removeListener('error', errorListener)
        })
    }

    return createServer()
      .then(function(wss) {
        var broadcastSet = new BroadcastSet()
        var frameProducer = new FrameProducer(
          new FrameConfig(display.properties, display.properties))

        broadcastSet.on('nonempty', function() {
          frameProducer.start()
        })

        broadcastSet.on('empty', function() {
          frameProducer.stop()
        })

        display.on('rotationChange', function(newRotation) {
          frameProducer.updateRotation(newRotation)
        })

        frameProducer.on('frame', function(frame) {
          broadcastSet.each(function(ws) {
            ws.send(frame, {
              binary: true
            })
          })
        })

        frameProducer.on('error', function(err) {
          log.fatal('Frame producer had an error', err.stack)
          lifecycle.fatal()
        })

        wss.on('connection', function(ws) {
          var id = uuid.v4()

          ws.on('message', function(data) {
            var match
            if ((match = /^(on|off|(size) ([0-9]+)x([0-9]+))$/.exec(data))) {
              switch (match[2] || match[1]) {
              case 'on':
                broadcastSet.insert(id, ws)
                break
              case 'off':
                broadcastSet.remove(id)
                break
              case 'size':
                frameProducer.updateProjection(+match[3], +match[4])
                break
              }
            }
          })

          ws.on('close', function() {
            broadcastSet.remove(id)
          })
        })

        lifecycle.observe(function() {
          wss.close()
        })

        lifecycle.observe(function() {
          frameProducer.stop()
        })
      })
      .return(plugin)
  })
