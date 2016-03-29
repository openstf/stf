var net = require('net')
var util = require('util')
var os = require('os')

var syrup = require('stf-syrup')
var Promise = require('bluebird')
var uuid = require('node-uuid')
var jpeg = require('jpeg-turbo')

var logger = require('../../../../util/logger')
var grouputil = require('../../../../util/grouputil')
var wire = require('../../../../wire')
var wireutil = require('../../../../wire/util')
var lifecycle = require('../../../../util/lifecycle')

var VncServer = require('./util/server')
var VncConnection = require('./util/connection')
var PointerTranslator = require('./util/pointertranslator')

module.exports = syrup.serial()
  .dependency(require('../../support/router'))
  .dependency(require('../../support/push'))
  .dependency(require('../screen/stream'))
  .dependency(require('../touch'))
  .dependency(require('../group'))
  .dependency(require('../solo'))
  .define(function(options, router, push, screenStream, touch, group, solo) {
    var log = logger.createLogger('device:plugins:vnc')

    function vncAuthHandler(data) {
      log.info(
        'VNC authentication attempt using "%s"'
      , data.response.toString('hex')
      )

      var resolver = Promise.defer()

      function notify() {
        group.get()
          .then(function(currentGroup) {
            push.send([
              solo.channel
            , wireutil.envelope(new wire.JoinGroupByVncAuthResponseMessage(
                options.serial
              , data.response.toString('hex')
              , currentGroup.group
              ))
            ])
          })
          .catch(grouputil.NoGroupError, function() {
            push.send([
              solo.channel
            , wireutil.envelope(new wire.JoinGroupByVncAuthResponseMessage(
                options.serial
              , data.response.toString('hex')
              ))
            ])
          })
      }

      function joinListener(newGroup, identifier) {
        if (!data.response.equals(new Buffer(identifier || '', 'hex'))) {
          resolver.reject(new Error('Someone else took the device'))
        }
      }

      function autojoinListener(identifier, joined) {
        if (data.response.equals(new Buffer(identifier, 'hex'))) {
          if (joined) {
            resolver.resolve()
          }
          else {
            resolver.reject(new Error('Device is already in use'))
          }
        }
      }

      group.on('join', joinListener)
      group.on('autojoin', autojoinListener)
      router.on(wire.VncAuthResponsesUpdatedMessage, notify)

      notify()

      return resolver.promise
        .timeout(5000)
        .finally(function() {
          group.removeListener('join', joinListener)
          group.removeListener('autojoin', autojoinListener)
          router.removeListener(wire.VncAuthResponsesUpdatedMessage, notify)
        })
    }

    function createServer() {
      log.info('Starting VNC server on port %d', options.vncPort)

      var opts = {
        name: options.serial
      , width: options.vncInitialSize[0]
      , height: options.vncInitialSize[1]
      , security: [{
          type: VncConnection.SECURITY_VNC
        , challenge: new Buffer(16).fill(0)
        , auth: vncAuthHandler
        }]
      }

      var vnc = new VncServer(net.createServer({
        allowHalfOpen: true
      }), opts)

      var listeningListener, errorListener
      return new Promise(function(resolve, reject) {
          listeningListener = function() {
            return resolve(vnc)
          }

          errorListener = function(err) {
            return reject(err)
          }

          vnc.on('listening', listeningListener)
          vnc.on('error', errorListener)

          vnc.listen(options.vncPort)
        })
        .finally(function() {
          vnc.removeListener('listening', listeningListener)
          vnc.removeListener('error', errorListener)
        })
    }

    return createServer()
      .then(function(vnc) {
        vnc.on('connection', function(conn) {
          log.info('New VNC connection from %s', conn.conn.remoteAddress)

          var id = util.format('vnc-%s', uuid.v4())

          var connState = {
            lastFrame: null
          , lastFrameTime: null
          , frameWidth: 0
          , frameHeight: 0
          , sentFrameTime: null
          , updateRequests: 0
          , frameConfig: {
              format: jpeg.FORMAT_RGB
            }
          }

          var pointerTranslator = new PointerTranslator()

          pointerTranslator.on('touchdown', function(event) {
            touch.touchDown(event)
          })

          pointerTranslator.on('touchmove', function(event) {
            touch.touchMove(event)
          })

          pointerTranslator.on('touchup', function(event) {
            touch.touchUp(event)
          })

          pointerTranslator.on('touchcommit', function() {
            touch.touchCommit()
          })

          function maybeSendFrame() {
            if (!connState.updateRequests) {
              return
            }

            if (!connState.lastFrame) {
              return
            }

            if (connState.lastFrameTime === connState.sentFrameTime) {
              return
            }

            var decoded = jpeg.decompressSync(
              connState.lastFrame, connState.frameConfig)

            conn.writeFramebufferUpdate([{
                xPosition: 0
              , yPosition: 0
              , width: decoded.width
              , height: decoded.height
              , encodingType: VncConnection.ENCODING_RAW
              , data: decoded.data
              }
            , {
                xPosition: 0
              , yPosition: 0
              , width: decoded.width
              , height: decoded.height
              , encodingType: VncConnection.ENCODING_DESKTOPSIZE
              }
            ])

            connState.updateRequests = 0
            connState.sentFrameTime = connState.lastFrameTime
          }

          function vncStartListener(frameProducer) {
            return new Promise(function(resolve) {
              connState.frameWidth = frameProducer.banner.virtualWidth
              connState.frameHeight = frameProducer.banner.virtualHeight
              resolve()
            })
          }

          function vncFrameListener(frame) {
            return new Promise(function(resolve) {
              connState.lastFrame = frame
              connState.lastFrameTime = Date.now()
              maybeSendFrame()
              resolve()
            })
          }

          function groupLeaveListener() {
            conn.end()
          }

          conn.on('authenticated', function() {
            screenStream.updateProjection(
              options.vncInitialSize[0], options.vncInitialSize[1])
            screenStream.broadcastSet.insert(id, {
              onStart: vncStartListener
            , onFrame: vncFrameListener
            })
          })

          conn.on('fbupdaterequest', function() {
            connState.updateRequests += 1
            maybeSendFrame()
          })

          conn.on('formatchange', function(format) {
            var same = os.endianness() === 'BE' ===
              Boolean(format.bigEndianFlag)
            var formatOrder = (format.redShift > format.blueShift) === same

            switch (format.bitsPerPixel) {
            case 8:
              connState.frameConfig = {
                format: jpeg.FORMAT_GRAY
              }
              break
            case 24:
              connState.frameConfig = {
                format: formatOrder ? jpeg.FORMAT_BGR : jpeg.FORMAT_RGB
              }
              break
            case 32:
              var f
              if (formatOrder) {
                f = format.blueShift === 0 ? jpeg.FORMAT_BGRX : jpeg.FORMAT_XBGR
              }
              else {
                f = format.redShift === 0 ? jpeg.FORMAT_RGBX : jpeg.FORMAT_XRGB
              }
              connState.frameConfig = {
                format: f
              }
              break
            }
          })

          conn.on('pointer', function(event) {
            pointerTranslator.push(event)
          })

          conn.on('close', function() {
            screenStream.broadcastSet.remove(id)
            group.removeListener('leave', groupLeaveListener)
          })

          conn.on('userActivity', function() {
            group.keepalive()
          })

          group.on('leave', groupLeaveListener)
        })

        lifecycle.observe(function() {
          vnc.close()
        })
      })
  })
