var util = require('util')

var Promise = require('bluebird')
var syrup = require('stf-syrup')
var split = require('split')

var wire = require('../../../wire')
var logger = require('../../../util/logger')
var lifecycle = require('../../../util/lifecycle')
var streamutil = require('../../../util/streamutil')
var SeqQueue = require('../../../wire/seqqueue')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../resources/minitouch'))
  .dependency(require('./flags'))
  .define(function(options, adb, router, minitouch, flags) {
    var log = logger.createLogger('device:plugins:touch')
    var plugin = Object.create(null)

    function startService() {
      log.info('Launching touch service')
      return adb.shell(options.serial, [
          'exec'
        , minitouch.bin
        ])
        .timeout(10000)
        .then(function(out) {
          lifecycle.share('Touch shell', out)
          streamutil.talk(log, 'Touch shell says: "%s"', out)
        })
    }

    function connectService() {
      function tryConnect(times, delay) {
        return adb.openLocal(options.serial, 'localabstract:minitouch')
          .timeout(10000)
          .then(function(out) {
            lifecycle.share('Touch socket', out)
            return out
          })
          .then(function(out) {
            return new Promise(function(resolve, reject) {
              out.pipe(split()).on('data', function(line) {
                var args = line.toString().split(/ /g)
                switch (args[0]) {
                  case 'v':
                    out.version = +args[1]
                    log.info('Touch protocol is version %d', out.version)
                    break
                  case '^':
                    out.maxContacts = args[1]
                    out.maxX = args[2]
                    out.maxY = args[3]
                    out.maxPressure = args[4]
                    log.info(
                      'Touch protocol reports %d contacts in a %dx%d grid '
                    + 'with a max pressure of %d'
                    , out.maxContacts
                    , out.maxX
                    , out.maxY
                    , out.maxPressure
                    )
                    return resolve(out)
                  default:
                    return reject(new Error(util.format(
                      'Unknown metadata "%s"'
                    , line
                    )))
                }
              })
            })
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
      log.info('Connecting to touch service')
      return tryConnect(5, 100)
    }

    return startService()
      .then(connectService)
      .then(function(socket) {
        var queue = new SeqQueue(100, 4)

        function send(command) {
          socket.write(command)
        }

        // Usually the touch origin is the same as the display's origin,
        // but sometimes it might not be.
        var getters = (function(origin) {
          log.info('Touch origin is %s', origin)
          return {
            'top left': {
              x: function(point) {
                return Math.floor(point.x * socket.maxX)
              }
            , y: function(point) {
                return Math.floor(point.y * socket.maxY)
              }
            }
            // So far the only device we've seen exhibiting this behavior
            // is Yoga Tablet 8.
          , 'bottom left': {
              x: function(point) {
                return Math.floor((1 - point.y) * socket.maxX)
              }
            , y: function(point) {
                return Math.floor(point.x * socket.maxY)
              }
            }
          }[origin]
        })(flags.get('forceTouchOrigin', 'top left'))

        plugin.touchDown = function(point) {
          send(util.format(
            'd %s %s %s %s\n'
          , point.contact
          , getters.x(point)
          , getters.y(point)
          , Math.floor((point.pressure || 0.5) * socket.maxPressure)
          ))
        }

        plugin.touchMove = function(point) {
          send(util.format(
            'm %s %s %s %s\n'
          , point.contact
          , getters.x(point)
          , getters.y(point)
          , Math.floor((point.pressure || 0.5) * socket.maxPressure)
          ))
        }

        plugin.touchUp = function(point) {
          send(util.format(
            'u %s\n'
          , point.contact
          ))
        }

        plugin.touchCommit = function() {
          send('c\n')
        }

        plugin.touchReset = function() {
          send('r\n')
        }

        plugin.tap = function(point) {
          plugin.touchDown(point)
          plugin.touchCommit()
          plugin.touchUp(point)
          plugin.touchCommit()
        }

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
              plugin.touchDown(message)
            })
          })
          .on(wire.TouchMoveMessage, function(channel, message) {
            queue.push(message.seq, function() {
              plugin.touchMove(message)
            })
          })
          .on(wire.TouchUpMessage, function(channel, message) {
            queue.push(message.seq, function() {
              plugin.touchUp(message)
            })
          })
          .on(wire.TouchCommitMessage, function(channel, message) {
            queue.push(message.seq, function() {
              plugin.touchCommit()
            })
          })
          .on(wire.TouchResetMessage, function(channel, message) {
            queue.push(message.seq, function() {
              plugin.touchReset()
            })
          })
      })
      .return(plugin)
  })
