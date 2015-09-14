var net = require('net')
var util = require('util')

var syrup = require('stf-syrup')
var Promise = require('bluebird')
var uuid = require('node-uuid')
var jpeg = require('jpeg-turbo')

var logger = require('../../../../util/logger')
var lifecycle = require('../../../../util/lifecycle')

var VncServer = require('./util/server')
var VncConnection = require('./util/connection')
var PointerTranslator = require('./util/pointertranslator')

module.exports = syrup.serial()
  .dependency(require('../screen/stream'))
  .dependency(require('../touch'))
  .define(function(options, screenStream, touch) {
    var log = logger.createLogger('device:plugins:vnc')

    function createServer() {
      log.info('Starting VNC server on port %d', options.vncPort)

      var opts = {
        name: options.serial
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
          var id = util.format('vnc-%s', uuid.v4())

          var connState = {
            lastFrame: null
          , lastFrameTime: null
          , frameWidth: 0
          , frameHeight: 0
          , sentFrameTime: null
          , updateRequests: 0
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

          function vncStartListener(frameProducer) {
            return new Promise(function(resolve/*, reject*/) {
              connState.frameWidth = frameProducer.banner.virtualWidth
              connState.frameHeight = frameProducer.banner.virtualHeight
              resolve()
            })
          }

          function vncFrameListener(frame) {
            return new Promise(function(resolve/*, reject*/) {
              connState.lastFrame = frame
              connState.lastFrameTime = Date.now()
              maybeSendFrame()
              resolve()
            })
          }

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

            var decoded = jpeg.decompressSync(connState.lastFrame)
            conn.writeFramebufferUpdate([
              { xPosition: 0
              , yPosition: 0
              , width: decoded.width
              , height: decoded.height
              , encodingType: VncConnection.ENCODING_RAW
              , data: decoded.data
              }
            , { xPosition: 0
              , yPosition: 0
              , width: decoded.width
              , height: decoded.height
              , encodingType: VncConnection.ENCODING_DESKTOPSIZE
              }
            ])

            connState.updateRequests = 0
            connState.sentFrameTime = connState.lastFrameTime
          }

          conn.on('authenticated', function() {
            screenStream.broadcastSet.insert(id, {
              onStart: vncStartListener
            , onFrame: vncFrameListener
            })
          })

          conn.on('fbupdaterequest', function() {
            connState.updateRequests += 1
            maybeSendFrame()
          })

          conn.on('pointer', function(event) {
            pointerTranslator.push(event)
          })

          conn.on('close', function() {
            screenStream.broadcastSet.remove(id)
          })
        })

        lifecycle.observe(function() {
          vnc.close()
        })
      })
  })
