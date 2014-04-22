var util = require('util')

var syrup = require('syrup')
var Promise = require('bluebird')

var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var devutil = require('../../../util/devutil')
var keyutil = require('../../../util/keyutil')
var streamutil = require('../../../util/streamutil')
var logger = require('../../../util/logger')
var ms = require('../../../wire/messagestream')
var lifecycle = require('../../../util/lifecycle')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../resources/service'))
  .define(function(options, adb, router, push, apk) {
    var log = logger.createLogger('device:plugins:input')
    var serviceQueue = []

    var agent = {
      socket: null
    , writer: null
    , port: 1090
    }

    var service = {
      socket: null
    , writer: null
    , reader: null
    , port: 1100
    }

    function openAgent() {
      log.info('Launching input agent')
      return stopAgent()
        .timeout(15000)
        .then(function() {
          return devutil.ensureUnusedPort(adb, options.serial, agent.port)
            .timeout(10000)
        })
        .then(function() {
          return adb.shell(options.serial, util.format(
              "export CLASSPATH='%s'; exec app_process /system/bin '%s'"
            , apk.path
            , apk.main
            ))
            .timeout(10000)
        })
        .then(function(out) {
          lifecycle.share('InputAgent shell', out)
          streamutil.talk(log, 'InputAgent says: "%s"', out)
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, agent.port)
            .timeout(10000)
        })
        .then(function(conn) {
          agent.socket = conn
          agent.writer = new ms.DelimitingStream()
          agent.writer.pipe(conn)
          lifecycle.share('InputAgent connection', conn)
        })
    }

    function stopAgent() {
      return devutil.killProcsByComm(
        adb
      , options.serial
      , 'app_process'
      , 'app_process'
      )
    }

    function callService(intent) {
      return adb.shell(options.serial, util.format(
          'am startservice --user 0 %s'
        , intent
        ))
        .timeout(15000)
        .then(function(out) {
          return streamutil.findLine(out, /^Error/)
            .finally(function() {
              out.end()
            })
            .timeout(10000)
            .then(function(line) {
              if (line.indexOf('--user') !== -1) {
                return adb.shell(options.serial, util.format(
                    'am startservice %s'
                  , intent
                  ))
                  .timeout(15000)
                  .then(function() {
                    return streamutil.findLine(out, /^Error/)
                      .finally(function() {
                        out.end()
                      })
                      .timeout(10000)
                      .then(function(line) {
                        throw new Error(util.format(
                          'Service had an error: "%s"'
                        , line
                        ))
                      })
                      .catch(streamutil.NoSuchLineError, function() {
                        return true
                      })
                  })
              }
              else {
                throw new Error(util.format(
                  'Service had an error: "%s"'
                , line
                ))
              }
            })
            .catch(streamutil.NoSuchLineError, function() {
              return true
            })
        })
    }

    function openService() {
      log.info('Launching input service')
      return stopService()
        .timeout(15000)
        .then(function() {
          return devutil.waitForPortToFree(adb, options.serial, service.port)
            .timeout(10000)
        })
        .then(function() {
          return callService(util.format("-a '%s'", apk.startAction))
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, service.port)
            .timeout(15000)
        })
        .then(function(conn) {
          service.socket = conn
          service.reader = conn.pipe(new ms.DelimitedStream())
          service.reader.on('data', function(data) {
              if (serviceQueue.length) {
                var resolver = serviceQueue.shift()
                resolver.resolve(data)
              }
              else {
                log.warn('Unexpected data from service', data)
              }
            })
          service.writer = new ms.DelimitingStream()
          service.writer.pipe(conn)
          lifecycle.share('InputService connection', conn)
        })
    }

    function stopService() {
      return callService(util.format("-a '%s'", apk.stopAction))
    }

    function keyEvent(data) {
      return runAgentCommand(
        apk.wire.RequestType.KEYEVENT
      , new apk.wire.KeyEventRequest(data)
      )
    }

    function type(text) {
      return runAgentCommand(
        apk.wire.RequestType.TYPE
      , new apk.wire.TypeRequest(text)
      )
    }

    function paste(text) {
      return setClipboard(text)
        .then(function() {
          keyEvent({
            event: apk.wire.KeyEvent.PRESS
          , keyCode: adb.Keycode.KEYCODE_V
          , ctrlKey: true
          })
        })
    }

    function wake() {
      return runAgentCommand(
        apk.wire.RequestType.WAKE
      , new apk.wire.WakeRequest()
      )
    }

    function freezeRotation(rotation) {
      return runAgentCommand(
        apk.wire.RequestType.SET_ROTATION
      , new apk.wire.SetRotationRequest(rotation, true)
      )
    }

    function thawRotation() {
      return runAgentCommand(
        apk.wire.RequestType.SET_ROTATION
      , new apk.wire.SetRotationRequest(0, false)
      )
    }

    function version() {
      return runServiceCommand(
          apk.wire.RequestType.VERSION
        , new apk.wire.VersionRequest()
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.VersionResponse.decode(data)
          if (response.success) {
            return response.version
          }
          throw new Error('Unable to retrieve version')
        })
    }

    function unlock() {
      return runServiceCommand(
          apk.wire.RequestType.SET_KEYGUARD_STATE
        , new apk.wire.SetKeyguardStateRequest(false)
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetKeyguardStateResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to unlock device')
          }
        })
    }

    function lock() {
      return runServiceCommand(
          apk.wire.RequestType.SET_KEYGUARD_STATE
        , new apk.wire.SetKeyguardStateRequest(true)
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetKeyguardStateResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to lock device')
          }
        })
    }

    function acquireWakeLock() {
      return runServiceCommand(
          apk.wire.RequestType.SET_WAKE_LOCK
        , new apk.wire.SetWakeLockRequest(true)
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetWakeLockResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to acquire WakeLock')
          }
        })
    }

    function releaseWakeLock() {
      return runServiceCommand(
          apk.wire.RequestType.SET_WAKE_LOCK
        , new apk.wire.SetWakeLockRequest(false)
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetWakeLockResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to release WakeLock')
          }
        })
    }

    function identity() {
      return runServiceCommand(
          apk.wire.RequestType.IDENTIFY
        , new apk.wire.IdentifyRequest(options.serial)
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.IdentifyResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to identify device')
          }
        })
    }

    function setClipboard(text) {
      return runServiceCommand(
          apk.wire.RequestType.SET_CLIPBOARD
        , new apk.wire.SetClipboardRequest(
            apk.wire.ClipboardType.TEXT
          , text
          )
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetClipboardResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to set clipboard')
          }
        })
    }

    function getClipboard() {
      return runServiceCommand(
          apk.wire.RequestType.GET_CLIPBOARD
        , new apk.wire.GetClipboardRequest(
            apk.wire.ClipboardType.TEXT
          )
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.GetClipboardResponse.decode(data)
          if (response.success) {
            switch (response.type) {
              case apk.wire.ClipboardType.TEXT:
                return response.text
            }
          }
          throw new Error('Unable to get clipboard')
        })
    }

    function getBrowsers() {
      return runServiceCommand(
          apk.wire.RequestType.GET_BROWSERS
        , new apk.wire.GetBrowsersRequest()
        )
        .timeout(15000)
        .then(function(data) {
          var response = apk.wire.GetBrowsersResponse.decode(data)
          if (response.success) {
            delete response.success
            return response
          }
          throw new Error('Unable to get browser list')
        })
    }

    function getProperties(properties) {
      return runServiceCommand(
          apk.wire.RequestType.GET_PROPERTIES
        , new apk.wire.GetPropertiesRequest(properties)
        )
        .timeout(15000)
        .then(function(data) {
          var response = apk.wire.GetPropertiesResponse.decode(data)
          if (response.success) {
            var mapped = Object.create(null)
            response.properties.forEach(function(property) {
              mapped[property.name] = property.value
            })
            return mapped
          }
          throw new Error('Unable to get properties')
        })
    }

    function runServiceCommand(type, cmd) {
      var resolver = Promise.defer()
      service.writer.write(new apk.wire.RequestEnvelope(
        type
      , cmd.encodeNB()
      ).encodeNB())
      serviceQueue.push(resolver)
      return resolver.promise
    }

    function runAgentCommand(type, cmd) {
      agent.writer.write(new apk.wire.RequestEnvelope(
        type
      , cmd.encodeNB()
      ).encodeNB())
    }

    return openAgent()
      .then(openService)
      .then(function() {
        router
          .on(wire.PhysicalIdentifyMessage, function(channel) {
            var reply = wireutil.reply(options.serial)
            identity()
            push.send([
              channel
            , reply.okay()
            ])
          })
          .on(wire.KeyDownMessage, function(channel, message) {
            keyEvent({
              event: apk.wire.KeyEvent.DOWN
            , keyCode: keyutil.unwire(message.keyCode)
            })
          })
          .on(wire.KeyUpMessage, function(channel, message) {
            keyEvent({
              event: apk.wire.KeyEvent.UP
            , keyCode: keyutil.unwire(message.keyCode)
            })
          })
          .on(wire.KeyPressMessage, function(channel, message) {
            keyEvent({
              event: apk.wire.KeyEvent.PRESS
            , keyCode: keyutil.unwire(message.keyCode)
            })
          })
          .on(wire.TypeMessage, function(channel, message) {
            type(message.text)
          })
          .on(wire.RotateMessage, function(channel, message) {
            if (message.rotation >= 0) {
              freezeRotation(message.rotation)
            }
            else {
              thawRotation()
            }
          })

        return {
          acquireWakeLock: acquireWakeLock
        , copy: getClipboard
        , getBrowsers: getBrowsers
        , getProperties: getProperties
        , identity: identity
        , lock: lock
        , paste: paste
        , releaseWakeLock: releaseWakeLock
        , unlock: unlock
        , version: version
        , wake: wake
        }
      })
  })
