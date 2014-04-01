var util = require('util')

var syrup = require('syrup')
var split = require('split')
var Promise = require('bluebird')

var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var devutil = require('../../../util/devutil')
var keyutil = require('../../../util/keyutil')
var streamutil = require('../../../util/streamutil')
var logger = require('../../../util/logger')
var ms = require('../../../wire/messagestream')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/quit'))
  .dependency(require('../resources/service'))
  .define(function(options, adb, router, push, quit, apk) {
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
        .then(function() {
          return devutil.ensureUnusedPort(adb, options.serial, agent.port)
        })
        .then(function() {
          return adb.shell(options.serial, util.format(
            "export CLASSPATH='%s'; exec app_process /system/bin '%s'"
          , apk.path
          , apk.main
          ))
        })
        .then(function(out) {
          out.pipe(split())
            .on('data', function(chunk) {
              log.info('Agent says: "%s"', chunk)
            })
            .on('error', function(err) {
              log.fatal('InputAgent shell had an error', err.stack)
              quit.fatal()
            })
            .on('end', function() {
              log.fatal('InputAgent shell ended')
              quit.fatal()
            })
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, agent.port)
        })
        .then(function(conn) {
          agent.socket = conn
          agent.writer = new ms.DelimitingStream()
          agent.writer.pipe(conn)
          conn.on('error', function(err) {
            log.fatal('InputAgent socket had an error', err.stack)
            quit.fatal()
          })
          conn.on('end', function() {
            log.fatal('InputAgent socket ended')
            quit.fatal()
          })
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
        .then(function(out) {
          return streamutil.findLine(out, /^Error/)
            .finally(function() {
              out.end()
            })
            .then(function(line) {
              if (line.indexOf('--user') !== -1) {
                return adb.shell(options.serial, util.format(
                    'am startservice %s'
                  , intent
                  ))
                  .then(function() {
                    return streamutil.findLine(out, /^Error/)
                      .finally(function() {
                        out.end()
                      })
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
        .then(function() {
          return devutil.waitForPortToFree(adb, options.serial, service.port)
        })
        .then(function() {
          return callService(util.format("-a '%s'", apk.startAction))
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, service.port)
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
          conn.on('error', function(err) {
              log.fatal('InputService socket had an error', err.stack)
              quit.fatal()
            })
            .on('end', function() {
              log.fatal('InputService socket ended')
              quit.fatal()
            })
        })
    }

    function stopService() {
      return callService(util.format("-a '%s'", apk.stopAction))
    }

    function sendInputEvent(event) {
      agent.writer.write(new apk.agentProto.InputEvent(event).encodeNB())
    }

    function version() {
      return runServiceCommand(
          apk.serviceProto.RequestType.VERSION
        , new apk.serviceProto.VersionRequest()
        )
        .then(function(data) {
          var response = apk.serviceProto.VersionResponse.decode(data)
          if (response.success) {
            return response.version
          }
          throw new Error('Unable to retrieve version')
        })
    }

    function unlock() {
      return runServiceCommand(
          apk.serviceProto.RequestType.SET_KEYGUARD_STATE
        , new apk.serviceProto.SetKeyguardStateRequest(false)
        )
        .then(function(data) {
          var response = apk.serviceProto.SetKeyguardStateResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to unlock device')
          }
        })
    }

    function lock() {
      return runServiceCommand(
          apk.serviceProto.RequestType.SET_KEYGUARD_STATE
        , new apk.serviceProto.SetKeyguardStateRequest(true)
        )
        .then(function(data) {
          var response = apk.serviceProto.SetKeyguardStateResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to lock device')
          }
        })
    }

    function acquireWakeLock() {
      return runServiceCommand(
          apk.serviceProto.RequestType.SET_WAKE_LOCK
        , new apk.serviceProto.SetWakeLockRequest(true)
        )
        .then(function(data) {
          var response = apk.serviceProto.SetWakeLockResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to acquire WakeLock')
          }
        })
    }

    function releaseWakeLock() {
      return runServiceCommand(
          apk.serviceProto.RequestType.SET_WAKE_LOCK
        , new apk.serviceProto.SetWakeLockRequest(false)
        )
        .then(function(data) {
          var response = apk.serviceProto.SetWakeLockResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to release WakeLock')
          }
        })
    }

    function identity() {
      return runServiceCommand(
          apk.serviceProto.RequestType.IDENTIFY
        , new apk.serviceProto.IdentifyRequest(options.serial)
        )
        .then(function(data) {
          var response = apk.serviceProto.IdentifyResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to identify device')
          }
        })
    }

    function setClipboard(text) {
      return runServiceCommand(
          apk.serviceProto.RequestType.SET_CLIPBOARD
        , new apk.serviceProto.SetClipboardRequest(
            apk.serviceProto.ClipboardType.TEXT
          , text
          )
        )
        .then(function(data) {
          var response = apk.serviceProto.SetClipboardResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to set clipboard')
          }
        })
    }

    function getClipboard() {
      return runServiceCommand(
          apk.serviceProto.RequestType.GET_CLIPBOARD
        , new apk.serviceProto.GetClipboardRequest(
            apk.serviceProto.ClipboardType.TEXT
          )
        )
        .then(function(data) {
          var response = apk.serviceProto.GetClipboardResponse.decode(data)
          if (response.success) {
            switch (response.type) {
              case apk.serviceProto.ClipboardType.TEXT:
                return response.text
            }
          }
          throw new Error('Unable to get clipboard')
        })
    }

    function getBrowsers() {
      return runServiceCommand(
          apk.serviceProto.RequestType.GET_BROWSERS
        , new apk.serviceProto.GetBrowsersRequest()
        )
        .then(function(data) {
          var response = apk.serviceProto.GetBrowsersResponse.decode(data)
          if (response.success) {
            delete response.success
            return response
          }
          throw new Error('Unable to get browser list')
        })
    }

    function runServiceCommand(type, cmd) {
      var resolver = Promise.defer()
      service.writer.write(new apk.serviceProto.RequestEnvelope(
        type
      , cmd.encodeNB()
      ).encodeNB())
      serviceQueue.push(resolver)
      return resolver.promise
    }

    return openAgent()
      .then(openService)
      .then(function() {
        router
          .on(wire.PhysicalIdentifyMessage, function(channel) {
            identity()
            push.send([
              channel
            , wireutil.envelope(new wire.TransactionDoneMessage(
                options.serial
              , 0
              , true
              ))
            ])
          })
          .on(wire.KeyDownMessage, function(channel, message) {
            sendInputEvent({
              action: 0
            , keyCode: keyutil.unwire(message.keyCode)
            })
          })
          .on(wire.KeyUpMessage, function(channel, message) {
            sendInputEvent({
              action: 1
            , keyCode: keyutil.unwire(message.keyCode)
            })
          })
          .on(wire.KeyPressMessage, function(channel, message) {
            sendInputEvent({
              action: 2
            , keyCode: keyutil.unwire(message.keyCode)
            })
          })
          .on(wire.TypeMessage, function(channel, message) {
            sendInputEvent({
              action: 3
            , keyCode: 0
            , text: message.text
            })
          })

        return {
          unlock: unlock
        , lock: lock
        , acquireWakeLock: acquireWakeLock
        , releaseWakeLock: releaseWakeLock
        , identity: identity
        , paste: function(text) {
            return setClipboard(text)
              .then(function() {
                sendInputEvent({
                  action: 2
                , keyCode: adb.Keycode.KEYCODE_V
                , ctrlKey: true
                })
              })
          }
        , copy: getClipboard
        , getBrowsers: getBrowsers
        }
      })
  })
