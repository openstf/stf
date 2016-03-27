var util = require('util')

var Promise = require('bluebird')
var syrup = require('stf-syrup')
var WebSocket = require('ws')
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
var StateQueue = require('../../../../util/statequeue')
var RiskyStream = require('../../../../util/riskystream')
var FailCounter = require('../../../../util/failcounter')

module.exports = syrup.serial()
  .dependency(require('../../support/adb'))
  .dependency(require('../../resources/minicap'))
  .dependency(require('../util/display'))
  .dependency(require('./options'))
  .define(function(options, adb, minicap, display, screenOptions) {
    var log = logger.createLogger('device:plugins:screen:stream')

    function FrameProducer(config) {
      EventEmitter.call(this)
      this.actionQueue = []
      this.runningState = FrameProducer.STATE_STOPPED
      this.desiredState = new StateQueue()
      this.output = null
      this.socket = null
      this.pid = -1
      this.banner = null
      this.parser = null
      this.frameConfig = config
      this.readable = false
      this.needsReadable = false
      this.failCounter = new FailCounter(3, 10000)
      this.failCounter.on('exceedLimit', this._failLimitExceeded.bind(this))
      this.failed = false
      this.readableListener = this._readableListener.bind(this)
    }

    util.inherits(FrameProducer, EventEmitter)

    FrameProducer.STATE_STOPPED = 1
    FrameProducer.STATE_STARTING = 2
    FrameProducer.STATE_STARTED = 3
    FrameProducer.STATE_STOPPING = 4

    FrameProducer.prototype._ensureState = function() {
      if (this.desiredState.empty()) {
        return
      }

      if (this.failed) {
        log.warn('Will not apply desired state due to too many failures')
        return
      }

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
              return this._waitForPid()
            })
            .then(function() {
              return this._connectService()
            })
            .then(function(socket) {
              this.parser = new FrameParser()
              this.socket = new RiskyStream(socket)
                .on('unexpectedEnd', this._socketEnded.bind(this))
              return this._readBanner(this.socket.stream)
            })
            .then(function(banner) {
              this.banner = banner
              return this._readFrames(this.socket.stream)
            })
            .then(function() {
              this.runningState = FrameProducer.STATE_STARTED
              this.emit('start')
            })
            .catch(Promise.CancellationError, function() {
              return this._stop()
            })
            .catch(function(err) {
              return this._stop().finally(function() {
                this.failCounter.inc()
                this.emit('error', err)
              })
            })
            .finally(function() {
              this._ensureState()
            })
        }
        else {
          setImmediate(this._ensureState.bind(this))
        }
        break
      case FrameProducer.STATE_STARTED:
        if (this.desiredState.next() === FrameProducer.STATE_STOPPED) {
          this.runningState = FrameProducer.STATE_STOPPING
          this._stop().finally(function() {
            this._ensureState()
          })
        }
        else {
          setImmediate(this._ensureState.bind(this))
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

    FrameProducer.prototype.nextFrame = function() {
      var frame = null
      var chunk

      if (this.parser) {
        while ((frame = this.parser.nextFrame()) === null) {
          chunk = this.socket.stream.read()
          if (chunk) {
            this.parser.push(chunk)
          }
          else {
            this.readable = false
            break
          }
        }
      }

      return frame
    }

    FrameProducer.prototype.needFrame = function() {
      this.needsReadable = true
      this._maybeEmitReadable()
    }

    FrameProducer.prototype._configChanged = function() {
      this.restart()
    }

    FrameProducer.prototype._socketEnded = function() {
      log.warn('Connection to minicap ended unexpectedly')
      this.failCounter.inc()
      this.restart()
    }

    FrameProducer.prototype._outputEnded = function() {
      log.warn('Shell keeping minicap running ended unexpectedly')
      this.failCounter.inc()
      this.restart()
    }

    FrameProducer.prototype._failLimitExceeded = function(limit, time) {
      this._stop()
      this.failed = true
      this.emit('error', new Error(util.format(
        'Failed more than %d times in %dms'
      , limit
      , time
      )))
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

        var match = /^PID: (\d+)$/.exec(line)
        if (match) {
          this.pid = Number(match[1])
          this.emit('pid', this.pid)
        }

        log.info('minicap says: "%s"', line)
      }.bind(this))
    }

    FrameProducer.prototype._waitForPid = function() {
      if (this.pid > 0) {
        return Promise.resolve(this.pid)
      }

      var pidListener
      return new Promise(function(resolve) {
          this.on('pid', pidListener = resolve)
        }.bind(this)).bind(this)
        .timeout(2000)
        .finally(function() {
          this.removeListener('pid', pidListener)
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
                  return tryConnect(times - 1, delay * 2)
                })
            }
            return Promise.reject(err)
          })
      }
      log.info('Connecting to minicap service')
      return tryConnect(5, 100)
    }

    FrameProducer.prototype._stop = function() {
      return this._disconnectService(this.socket).bind(this)
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
          this.pid = -1
          this.banner = null
          this.parser = null
        })
    }

    FrameProducer.prototype._disconnectService = function(socket) {
      log.info('Disconnecting from minicap service')

      if (!socket || socket.ended) {
        return Promise.resolve(true)
      }

      socket.stream.removeListener('readable', this.readableListener)

      var endListener
      return new Promise(function(resolve) {
          socket.on('end', endListener = function() {
            resolve(true)
          })

          socket.stream.resume()
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

      var pid = this.pid

      function kill(signal) {
        if (pid <= 0) {
          return Promise.reject(new Error('Minicap service pid is unknown'))
        }

        var signum = {
          SIGTERM: -15
        , SIGKILL: -9
        }[signal]

        log.info('Sending %s to minicap', signal)
        return Promise.all([
            output.waitForEnd()
          , adb.shell(options.serial, ['kill', signum, pid])
              .then(adbkit.util.readAll)
              .return(true)
          ])
          .timeout(2000)
      }

      function kindKill() {
        return kill('SIGTERM')
      }

      function forceKill() {
        return kill('SIGKILL')
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

    FrameProducer.prototype._readBanner = function(socket) {
      log.info('Reading minicap banner')
      return bannerutil.read(socket).timeout(2000)
    }

    FrameProducer.prototype._readFrames = function(socket) {
      this.needsReadable = true
      socket.on('readable', this.readableListener)

      // We may already have data pending. Let the user know they should
      // at least attempt to read frames now.
      this.readableListener()
    }

    FrameProducer.prototype._maybeEmitReadable = function() {
      if (this.readable && this.needsReadable) {
        this.needsReadable = false
        this.emit('readable')
      }
    }

    FrameProducer.prototype._readableListener = function() {
      this.readable = true
      this._maybeEmitReadable()
    }

    function createServer() {
      log.info('Starting WebSocket server on port %d', screenOptions.publicPort)

      var wss = new WebSocket.Server({
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
        var frameProducer = new FrameProducer(
          new FrameConfig(display.properties, display.properties))
        var broadcastSet = frameProducer.broadcastSet = new BroadcastSet()

        broadcastSet.on('nonempty', function() {
          frameProducer.start()
        })

        broadcastSet.on('empty', function() {
          frameProducer.stop()
        })

        broadcastSet.on('insert', function(id) {
          // If two clients join a session in the middle, one of them
          // may not release the initial size because the projection
          // doesn't necessarily change, and the producer doesn't Getting
          // restarted. Therefore we have to call onStart() manually
          // if the producer is already up and running.
          switch (frameProducer.runningState) {
          case FrameProducer.STATE_STARTED:
            broadcastSet.get(id).onStart(frameProducer)
            break
          }
        })

        display.on('rotationChange', function(newRotation) {
          frameProducer.updateRotation(newRotation)
        })

        frameProducer.on('start', function() {
          broadcastSet.keys().map(function(id) {
            return broadcastSet.get(id).onStart(frameProducer)
          })
        })

        frameProducer.on('readable', function next() {
          var frame = frameProducer.nextFrame()
          if (frame) {
            Promise.settle([broadcastSet.keys().map(function(id) {
              return broadcastSet.get(id).onFrame(frame)
            })]).then(next)
          }
          else {
            frameProducer.needFrame()
          }
        })

        frameProducer.on('error', function(err) {
          log.fatal('Frame producer had an error', err.stack)
          lifecycle.fatal()
        })

        wss.on('connection', function(ws) {
          var id = uuid.v4()

          function wsStartNotifier() {
            return new Promise(function(resolve, reject) {
              var message = util.format(
                'start %s'
              , JSON.stringify(frameProducer.banner)
              )

              switch (ws.readyState) {
              case WebSocket.OPENING:
                // This should never happen.
                log.warn('Unable to send banner to OPENING client "%s"', id)
                break
              case WebSocket.OPEN:
                // This is what SHOULD happen.
                ws.send(message, function(err) {
                  return err ? reject(err) : resolve()
                })
                break
              case WebSocket.CLOSING:
                // Ok, a 'close' event should remove the client from the set
                // soon.
                break
              case WebSocket.CLOSED:
                // This should never happen.
                log.warn('Unable to send banner to CLOSED client "%s"', id)
                broadcastSet.remove(id)
                break
              }
            })
          }

          function wsFrameNotifier(frame) {
            return new Promise(function(resolve, reject) {
              switch (ws.readyState) {
              case WebSocket.OPENING:
                // This should never happen.
                return reject(new Error(util.format(
                  'Unable to send frame to OPENING client "%s"', id)))
              case WebSocket.OPEN:
                // This is what SHOULD happen.
                ws.send(frame, {
                  binary: true
                }, function(err) {
                  return err ? reject(err) : resolve()
                })
                return
              case WebSocket.CLOSING:
                // Ok, a 'close' event should remove the client from the set
                // soon.
                return
              case WebSocket.CLOSED:
                // This should never happen.
                broadcastSet.remove(id)
                return reject(new Error(util.format(
                  'Unable to send frame to CLOSED client "%s"', id)))
              }
            })
          }

          ws.on('message', function(data) {
            var match = /^(on|off|(size) ([0-9]+)x([0-9]+))$/.exec(data)
            if (match) {
              switch (match[2] || match[1]) {
              case 'on':
                broadcastSet.insert(id, {
                  onStart: wsStartNotifier
                , onFrame: wsFrameNotifier
                })
                break
              case 'off':
                broadcastSet.remove(id)
                break
              case 'size':
                frameProducer.updateProjection(
                  Number(match[3]), Number(match[4]))
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

        return frameProducer
      })
  })
