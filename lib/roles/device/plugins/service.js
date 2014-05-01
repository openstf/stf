var util = require('util')

var syrup = require('syrup')
var Promise = require('bluebird')
var _ = require('lodash')

var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var devutil = require('../../../util/devutil')
var keyutil = require('../../../util/keyutil')
var streamutil = require('../../../util/streamutil')
var logger = require('../../../util/logger')
var ms = require('../../../wire/messagestream')
var lifecycle = require('../../../util/lifecycle')

function MessageResolver() {
  this.resolvers = Object.create(null)

  this.await = function(id, resolver) {
    this.resolvers[id] = resolver
    return resolver.promise
  }

  this.resolve = function(id, value) {
    var resolver = this.resolvers[id]
    delete this.resolvers[id]
    resolver.resolve(value)
    return resolver.promise
  }
}

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../resources/service'))
  .define(function(options, adb, router, push, apk) {
    var log = logger.createLogger('device:plugins:service')
    var messageResolver = new MessageResolver()

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
      log.info('Launching agent')
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
          lifecycle.share('Agent shell', out)
          streamutil.talk(log, 'Agent says: "%s"', out)
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, agent.port)
            .timeout(10000)
        })
        .then(function(conn) {
          agent.socket = conn
          agent.writer = new ms.DelimitingStream()
          agent.writer.pipe(conn)
          lifecycle.share('Agent connection', conn)
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
      log.info('Launching service')
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
          service.reader.on('data', handleEnvelope)
          service.writer = new ms.DelimitingStream()
          service.writer.pipe(conn)
          lifecycle.share('Service connection', conn)
        })
    }

    function handleEnvelope(data) {
      var envelope = apk.wire.Envelope.decode(data)
      if (envelope.id !== null) {
        messageResolver.resolve(envelope.id, envelope.message)
      }
      else {
        switch (envelope.type) {
          case apk.wire.MessageType.EVENT_AIRPLANE_MODE:
            var message = apk.wire.AirplaneModeEvent.decode(envelope.message)
            push.send([
              wireutil.global
            , wireutil.envelope(new wire.AirplaneModeEvent(
                options.serial
              , message.enabled
              ))
            ])
            break
          case apk.wire.MessageType.EVENT_BATTERY:
            var message = apk.wire.BatteryEvent.decode(envelope.message)
            push.send([
              wireutil.global
            , wireutil.envelope(new wire.BatteryEvent(
                options.serial
              , message.status
              , message.health
              , message.source
              , message.level
              , message.scale
              , message.temp
              , message.voltage
              ))
            ])
            break
          case apk.wire.MessageType.EVENT_BROWSER_PACKAGE:
            var message = apk.wire.BrowserPackageEvent.decode(envelope.message)
            push.send([
              wireutil.global
            , wireutil.envelope(new wire.BrowserPackageEvent(
                options.serial
              , message.selected
              , message.apps.map(function(app) {
                  return new wire.BrowserApp(
                    app.name
                  , app.component
                  , app.selected
                  )
                })
              ))
            ])
            break
          case apk.wire.MessageType.EVENT_CONNECTIVITY:
            var message = apk.wire.ConnectivityEvent.decode(envelope.message)
            push.send([
              wireutil.global
            , wireutil.envelope(new wire.ConnectivityEvent(
                options.serial
              , message.connected
              , message.type
              , message.subtype
              , message.failover
              , message.roaming
              ))
            ])
            break
          case apk.wire.MessageType.EVENT_PHONE_STATE:
            var message = apk.wire.PhoneStateEvent.decode(envelope.message)
            push.send([
              wireutil.global
            , wireutil.envelope(new wire.PhoneStateEvent(
                options.serial
              , message.state
              , message.manual
              , message.operator
              ))
            ])
            break
          case apk.wire.MessageType.EVENT_ROTATION:
            var message = apk.wire.RotationEvent.decode(envelope.message)
            push.send([
              wireutil.global
            , wireutil.envelope(new wire.RotationEvent(
                options.serial
              , message.rotation
              ))
            ])
            break
        }
      }
    }

    function stopService() {
      return callService(util.format("-a '%s'", apk.stopAction))
    }

    function keyEvent(data) {
      return runAgentCommand(
        apk.wire.MessageType.DO_KEYEVENT
      , new apk.wire.KeyEventRequest(data)
      )
    }

    function type(text) {
      return runAgentCommand(
        apk.wire.MessageType.DO_TYPE
      , new apk.wire.DoTypeRequest(text)
      )
    }

    function paste(text) {
      return setClipboard(text)
        .then(function() {
          keyEvent({
            event: apk.wire.MessageType.DO_PRESS
          , keyCode: adb.Keycode.KEYCODE_V
          , ctrlKey: true
          })
        })
    }

    function wake() {
      return runAgentCommand(
        apk.wire.MessageType.DO_WAKE
      , new apk.wire.DoWakeRequest()
      )
    }

    function freezeRotation(rotation) {
      return runAgentCommand(
        apk.wire.MessageType.SET_ROTATION
      , new apk.wire.SetRotationRequest(rotation, true)
      )
    }

    function thawRotation() {
      return runAgentCommand(
        apk.wire.MessageType.SET_ROTATION
      , new apk.wire.SetRotationRequest(0, false)
      )
    }

    function version() {
      return runServiceCommand(
          apk.wire.MessageType.GET_VERSION
        , new apk.wire.GetVersionRequest()
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.GetVersionResponse.decode(data)
          if (response.success) {
            return response.version
          }
          throw new Error('Unable to retrieve version')
        })
    }

    function unlock() {
      return runServiceCommand(
          apk.wire.MessageType.SET_KEYGUARD_STATE
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
          apk.wire.MessageType.SET_KEYGUARD_STATE
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
          apk.wire.MessageType.SET_WAKE_LOCK
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
          apk.wire.MessageType.SET_WAKE_LOCK
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
          apk.wire.MessageType.DO_IDENTIFY
        , new apk.wire.DoIdentifyRequest(options.serial)
        )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.DoIdentifyResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to identify device')
          }
        })
    }

    function setClipboard(text) {
      return runServiceCommand(
          apk.wire.MessageType.SET_CLIPBOARD
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
          apk.wire.MessageType.GET_CLIPBOARD
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
          apk.wire.MessageType.GET_BROWSERS
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
          apk.wire.MessageType.GET_PROPERTIES
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
      var id = Math.floor(Math.random() * 0xFFFFFF)
      service.writer.write(new apk.wire.Envelope(
        id
      , type
      , cmd.encodeNB()
      ).encodeNB())
      return messageResolver.await(id, resolver)
    }

    function runAgentCommand(type, cmd) {
      agent.writer.write(new apk.wire.Envelope(
        null
      , type
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
