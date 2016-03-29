var util = require('util')

var Promise = require('bluebird')
var syrup = require('stf-syrup')
var split = require('split')
var EventEmitter = require('eventemitter3').EventEmitter
var adbkit = require('adbkit')
var Parser = require('adbkit/lib/adb/parser')

var wire = require('../../../../wire')
var logger = require('../../../../util/logger')
var lifecycle = require('../../../../util/lifecycle')
var SeqQueue = require('../../../../wire/seqqueue')
var StateQueue = require('../../../../util/statequeue')
var RiskyStream = require('../../../../util/riskystream')
var FailCounter = require('../../../../util/failcounter')

module.exports = syrup.serial()
  .dependency(require('../../support/adb'))
  .dependency(require('../../support/router'))
  .dependency(require('../../resources/minitouch'))
  .dependency(require('../util/flags'))
  .define(function(options, adb, router, minitouch, flags) {
    var log = logger.createLogger('device:plugins:touch')

    function TouchConsumer(config) {
      EventEmitter.call(this)
      this.actionQueue = []
      this.runningState = TouchConsumer.STATE_STOPPED
      this.desiredState = new StateQueue()
      this.output = null
      this.socket = null
      this.banner = null
      this.touchConfig = config
      this.starter = Promise.resolve(true)
      this.failCounter = new FailCounter(3, 10000)
      this.failCounter.on('exceedLimit', this._failLimitExceeded.bind(this))
      this.failed = false
      this.readableListener = this._readableListener.bind(this)
      this.writeQueue = []
    }

    util.inherits(TouchConsumer, EventEmitter)

    TouchConsumer.STATE_STOPPED = 1
    TouchConsumer.STATE_STARTING = 2
    TouchConsumer.STATE_STARTED = 3
    TouchConsumer.STATE_STOPPING = 4

    TouchConsumer.prototype._queueWrite = function(writer) {
      switch (this.runningState) {
      case TouchConsumer.STATE_STARTED:
        writer.call(this)
        break
      default:
        this.writeQueue.push(writer)
        break
      }
    }

    TouchConsumer.prototype.touchDown = function(point) {
      this._queueWrite(function() {
        return this._write(util.format(
          'd %s %s %s %s\n'
        , point.contact
        , Math.floor(this.touchConfig.origin.x(point) * this.banner.maxX)
        , Math.floor(this.touchConfig.origin.y(point) * this.banner.maxY)
        , Math.floor((point.pressure || 0.5) * this.banner.maxPressure)
        ))
      })
    }

    TouchConsumer.prototype.touchMove = function(point) {
      this._queueWrite(function() {
        return this._write(util.format(
          'm %s %s %s %s\n'
        , point.contact
        , Math.floor(this.touchConfig.origin.x(point) * this.banner.maxX)
        , Math.floor(this.touchConfig.origin.y(point) * this.banner.maxY)
        , Math.floor((point.pressure || 0.5) * this.banner.maxPressure)
        ))
      })
    }

    TouchConsumer.prototype.touchUp = function(point) {
      this._queueWrite(function() {
        return this._write(util.format(
          'u %s\n'
        , point.contact
        ))
      })
    }

    TouchConsumer.prototype.touchCommit = function() {
      this._queueWrite(function() {
        return this._write('c\n')
      })
    }

    TouchConsumer.prototype.touchReset = function() {
      this._queueWrite(function() {
        return this._write('r\n')
      })
    }

    TouchConsumer.prototype.tap = function(point) {
      this.touchDown(point)
      this.touchCommit()
      this.touchUp(point)
      this.touchCommit()
    }

    TouchConsumer.prototype._ensureState = function() {
      if (this.desiredState.empty()) {
        return
      }

      if (this.failed) {
        log.warn('Will not apply desired state due to too many failures')
        return
      }

      switch (this.runningState) {
      case TouchConsumer.STATE_STARTING:
      case TouchConsumer.STATE_STOPPING:
        // Just wait.
        break
      case TouchConsumer.STATE_STOPPED:
        if (this.desiredState.next() === TouchConsumer.STATE_STARTED) {
          this.runningState = TouchConsumer.STATE_STARTING
          this.starter = this._startService().bind(this)
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
              return this._readUnexpected(this.socket.stream)
            })
            .then(function() {
              this._processWriteQueue()
            })
            .then(function() {
              this.runningState = TouchConsumer.STATE_STARTED
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
      case TouchConsumer.STATE_STARTED:
        if (this.desiredState.next() === TouchConsumer.STATE_STOPPED) {
          this.runningState = TouchConsumer.STATE_STOPPING
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

    TouchConsumer.prototype.start = function() {
      log.info('Requesting touch consumer to start')
      this.desiredState.push(TouchConsumer.STATE_STARTED)
      this._ensureState()
    }

    TouchConsumer.prototype.stop = function() {
      log.info('Requesting touch consumer to stop')
      this.desiredState.push(TouchConsumer.STATE_STOPPED)
      this._ensureState()
    }

    TouchConsumer.prototype.restart = function() {
      switch (this.runningState) {
      case TouchConsumer.STATE_STARTED:
      case TouchConsumer.STATE_STARTING:
        this.starter.cancel()
        this.desiredState.push(TouchConsumer.STATE_STOPPED)
        this.desiredState.push(TouchConsumer.STATE_STARTED)
        this._ensureState()
        break
      }
    }

    TouchConsumer.prototype._configChanged = function() {
      this.restart()
    }

    TouchConsumer.prototype._socketEnded = function() {
      log.warn('Connection to minitouch ended unexpectedly')
      this.failCounter.inc()
      this.restart()
    }

    TouchConsumer.prototype._outputEnded = function() {
      log.warn('Shell keeping minitouch running ended unexpectedly')
      this.failCounter.inc()
      this.restart()
    }

    TouchConsumer.prototype._failLimitExceeded = function(limit, time) {
      this._stop()
      this.failed = true
      this.emit('error', new Error(util.format(
        'Failed more than %d times in %dms'
      , limit
      , time
      )))
    }

    TouchConsumer.prototype._startService = function() {
      log.info('Launching screen service')
      return minitouch.run()
        .timeout(10000)
    }

    TouchConsumer.prototype._readOutput = function(out) {
      out.pipe(split()).on('data', function(line) {
        var trimmed = line.toString().trim()

        if (trimmed === '') {
          return
        }

        if (/ERROR/.test(line)) {
          log.fatal('minitouch error: "%s"', line)
          return lifecycle.fatal()
        }

        log.info('minitouch says: "%s"', line)
      })
    }

    TouchConsumer.prototype._connectService = function() {
      function tryConnect(times, delay) {
        return adb.openLocal(options.serial, 'localabstract:minitouch')
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
      log.info('Connecting to minitouch service')
      // SH-03G can be very slow to start sometimes. Make sure we try long
      // enough.
      return tryConnect(7, 100)
    }

    TouchConsumer.prototype._stop = function() {
      return this._disconnectService(this.socket).bind(this)
        .timeout(2000)
        .then(function() {
          return this._stopService(this.output).timeout(10000)
        })
        .then(function() {
          this.runningState = TouchConsumer.STATE_STOPPED
          this.emit('stop')
        })
        .catch(function(err) {
          // In practice we _should_ never get here due to _stopService()
          // being quite aggressive. But if we do, well... assume it
          // stopped anyway for now.
          this.runningState = TouchConsumer.STATE_STOPPED
          this.emit('error', err)
          this.emit('stop')
        })
        .finally(function() {
          this.output = null
          this.socket = null
          this.banner = null
        })
    }

    TouchConsumer.prototype._disconnectService = function(socket) {
      log.info('Disconnecting from minitouch service')

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

    TouchConsumer.prototype._stopService = function(output) {
      log.info('Stopping minitouch service')

      if (!output || output.ended) {
        return Promise.resolve(true)
      }

      var pid = this.banner ? this.banner.pid : -1

      function kill(signal) {
        if (pid <= 0) {
          return Promise.reject(new Error('Minitouch service pid is unknown'))
        }

        var signum = {
          SIGTERM: -15
        , SIGKILL: -9
        }[signal]

        log.info('Sending %s to minitouch', signal)
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
        log.info('Ending minitouch I/O as a last resort')
        output.end()
        return Promise.resolve(true)
      }

      return kindKill()
        .catch(Promise.TimeoutError, forceKill)
        .catch(forceEnd)
    }

    TouchConsumer.prototype._readBanner = function(socket) {
      log.info('Reading minitouch banner')

      var parser = new Parser(socket)
      var banner = {
        pid: -1 // @todo
      , version: 0
      , maxContacts: 0
      , maxX: 0
      , maxY: 0
      , maxPressure: 0
      }

      function readVersion() {
        return parser.readLine()
          .then(function(chunk) {
            var args = chunk.toString().split(/ /g)
            switch (args[0]) {
              case 'v':
                banner.version = Number(args[1])
                break
              default:
                throw new Error(util.format(
                  'Unexpected output "%s", expecting version line'
                , chunk
                ))
            }
          })
      }

      function readLimits() {
        return parser.readLine()
          .then(function(chunk) {
            var args = chunk.toString().split(/ /g)
            switch (args[0]) {
              case '^':
                banner.maxContacts = args[1]
                banner.maxX = args[2]
                banner.maxY = args[3]
                banner.maxPressure = args[4]
                break
              default:
                throw new Error(util.format(
                  'Unknown output "%s", expecting limits line'
                , chunk
                ))
            }
          })
      }

      function readPid() {
        return parser.readLine()
          .then(function(chunk) {
            var args = chunk.toString().split(/ /g)
            switch (args[0]) {
              case '$':
                banner.pid = Number(args[1])
                break
              default:
                throw new Error(util.format(
                  'Unexpected output "%s", expecting pid line'
                , chunk
                ))
            }
          })
      }

      return readVersion()
        .then(readLimits)
        .then(readPid)
        .return(banner)
        .timeout(2000)
    }

    TouchConsumer.prototype._readUnexpected = function(socket) {
      socket.on('readable', this.readableListener)

      // We may already have data pending.
      this.readableListener()
    }

    TouchConsumer.prototype._readableListener = function() {
      var chunk

      while ((chunk = this.socket.stream.read())) {
        log.warn('Unexpected output from minitouch socket', chunk)
      }
    }

    TouchConsumer.prototype._processWriteQueue = function() {
      for (var i = 0, l = this.writeQueue.length; i < l; ++i) {
        this.writeQueue[i].call(this)
      }

      this.writeQueue = []
    }

    TouchConsumer.prototype._write = function(chunk) {
      this.socket.stream.write(chunk)
    }

    function startConsumer() {
      var touchConsumer = new TouchConsumer({
        // Usually the touch origin is the same as the display's origin,
        // but sometimes it might not be.
        origin: (function(origin) {
          log.info('Touch origin is %s', origin)
          return {
            'top left': {
              x: function(point) {
                return point.x
              }
            , y: function(point) {
                return point.y
              }
            }
            // So far the only device we've seen exhibiting this behavior
            // is Yoga Tablet 8.
          , 'bottom left': {
              x: function(point) {
                return 1 - point.y
              }
            , y: function(point) {
                return point.x
              }
            }
          }[origin]
        })(flags.get('forceTouchOrigin', 'top left'))
      })

      var startListener, errorListener

      return new Promise(function(resolve, reject) {
        touchConsumer.on('start', startListener = function() {
          resolve(touchConsumer)
        })

        touchConsumer.on('error', errorListener = reject)

        touchConsumer.start()
      })
      .finally(function() {
        touchConsumer.removeListener('start', startListener)
        touchConsumer.removeListener('error', errorListener)
      })
    }

    return startConsumer()
      .then(function(touchConsumer) {
        var queue = new SeqQueue(100, 4)

        touchConsumer.on('error', function(err) {
          log.fatal('Touch consumer had an error', err.stack)
          lifecycle.fatal()
        })

        router
          .on(wire.GestureStartMessage, function(channel, message) {
            queue.start(message.seq)
          })
          .on(wire.GestureStopMessage, function(channel, message) {
            queue.push(message.seq, function() {
              queue.stop()
            })
          })
          .on(wire.TouchDownMessage, function(channel, message) {
            queue.push(message.seq, function() {
              touchConsumer.touchDown(message)
            })
          })
          .on(wire.TouchMoveMessage, function(channel, message) {
            queue.push(message.seq, function() {
              touchConsumer.touchMove(message)
            })
          })
          .on(wire.TouchUpMessage, function(channel, message) {
            queue.push(message.seq, function() {
              touchConsumer.touchUp(message)
            })
          })
          .on(wire.TouchCommitMessage, function(channel, message) {
            queue.push(message.seq, function() {
              touchConsumer.touchCommit()
            })
          })
          .on(wire.TouchResetMessage, function(channel, message) {
            queue.push(message.seq, function() {
              touchConsumer.touchReset()
            })
          })

        return touchConsumer
      })
  })
