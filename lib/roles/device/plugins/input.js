var util = require('util')

var syrup = require('syrup')
var split = require('split')
var ByteBuffer = require('protobufjs/node_modules/bytebuffer')

var wire = require('../../../wire')
var devutil = require('../../../util/devutil')
var keyutil = require('../../../util/keyutil')
var streamutil = require('../../../util/streamutil')
var logger = require('../../../util/logger')

module.exports = syrup()
  .dependency(require('./adb'))
  .dependency(require('./router'))
  .dependency(require('./quit'))
  .dependency(require('../resources/inputagent'))
  .define(function(options, adb, router, quit, apk) {
    var log = logger.createLogger('device:plugins:input')

    var agent = {
      socket: null
    , port: 1090
    }

    var service = {
      socket: null
    , port: 1100
    , startAction: 'jp.co.cyberagent.stf.input.agent.InputService.ACTION_START'
    , stopAction: 'jp.co.cyberagent.stf.input.agent.InputService.ACTION_STOP'
    }

    function openAgent() {
      log.info('Launching input agent')
      return stopAgent()
        .then(function() {
          return devutil.ensureUnusedPort(adb, options.serial, agent.port)
        })
        .then(function() {
          return adb.shell(options.serial, util.format(
            "export CLASSPATH='%s';"
          + " exec app_process /system/bin '%s'"
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
          return callService(util.format("-a '%s'", service.startAction))
        })
        .then(function() {
          return devutil.waitForPort(adb, options.serial, service.port)
        })
        .then(function(conn) {
          service.socket = conn
          conn.on('error', function(err) {
            log.fatal('InputService socket had an error', err.stack)
            quit.fatal()
          })
          conn.on('end', function() {
            log.fatal('InputService socket ended')
            quit.fatal()
          })
        })
    }

    function stopService() {
      return callService(util.format("-a '%s'", service.stopAction))
    }

    function sendInputEvent(event) {
      var lengthBuffer = new ByteBuffer()
        , messageBuffer = new resource.proto.InputEvent(event).encode()

      // Delimiter
      lengthBuffer.writeVarint32(messageBuffer.length)

      agent.socket.write(Buffer.concat([
        lengthBuffer.toBuffer()
      , messageBuffer.toBuffer()
      ]))
    }

    return openAgent()
      .then(openService)
      .then(function() {
        router
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
          unlock: function() {
            service.socket.write('unlock\n')
          }
        , lock: function() {
            service.socket.write('lock\n')
          }
        , acquireWakeLock: function() {
            service.socket.write('acquire wake lock\n')
          }
        , releaseWakeLock: function() {
            service.socket.write('release wake lock\n')
          }
        , identity: function() {
            service.socket.write(util.format(
              'show identity %s\n'
            , options.serial
            ))
          }
        }
      })
  })
