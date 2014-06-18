var http = require('http')
var events = require('events')
var util = require('util')

var socketio = require('socket.io')
var zmq = require('zmq')
var Promise = require('bluebird')
var _ = require('lodash')
var request = Promise.promisifyAll(require('request'))

var logger = require('../util/logger')
var wire = require('../wire')
var wireutil = require('../wire/util')
var wirerouter = require('../wire/router')
var dbapi = require('../db/api')
var datautil = require('../util/datautil')
var cookieSession = require('./websocket/middleware/cookie-session')
var ip = require('./websocket/middleware/remote-ip')
var auth = require('./websocket/middleware/auth')

module.exports = function(options) {
  var log = logger.createLogger('websocket')
    , server = http.createServer()
    , io = socketio.listen(server, {
        serveClient: false
      , transports: ['websocket']
      })
    , channelRouter = new events.EventEmitter()

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('Sending output to %s', endpoint)
    push.connect(endpoint)
  })

  // Input
  var sub = zmq.socket('sub')
  options.endpoints.sub.forEach(function(endpoint) {
    log.info('Receiving input from %s', endpoint)
    sub.connect(endpoint)
  })

  // Establish always-on channels
  ;[wireutil.global].forEach(function(channel) {
    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
  })

  sub.on('message', function(channel, data) {
    channelRouter.emit(channel.toString(), channel, data)
  })

  io.use(cookieSession({
    name: options.ssid
  , keys: [options.secret]
  }))

  io.use(ip({
    trust: function() {
      return true
    }
  }))

  io.use(auth)

  io.on('connection', function(socket) {
    var channels = []
      , user = socket.request.user

    socket.emit('socket.ip', socket.request.ip)

    function joinChannel(channel) {
      channels.push(channel)
      channelRouter.on(channel, messageListener)
      sub.subscribe(channel)
    }

    function leaveChannel(channel) {
      _.pull(channels, channel)
      channelRouter.removeListener(channel, messageListener)
      sub.unsubscribe(channel)
    }

    function createTouchHandler(Klass) {
      return function(channel, data) {
        push.send([
          channel
        , wireutil.envelope(new Klass(
            data.seq
          , data.x
          , data.y
          ))
        ])
      }
    }

    function createKeyHandler(Klass) {
      return function(channel, data) {
        push.send([
          channel
        , wireutil.envelope(new Klass(
            data.key
          ))
        ])
      }
    }

    var messageListener = wirerouter()
      .on(wire.DeviceLogMessage, function(channel, message) {
        socket.emit('device.log', message)
      })
      .on(wire.DevicePresentMessage, function(channel, message) {
        socket.emit('device.add', {
          important: true
        , data: {
            serial: message.serial
          , provider: message.provider
          , present: true
          }
        })
      })
      .on(wire.DeviceAbsentMessage, function(channel, message) {
        socket.emit('device.remove', {
          important: true
        , data: {
            serial: message.serial
          , present: false
          , ready: false
          , lastHeartbeatAt: null
          , using: false
          }
        })
      })
      .on(wire.JoinGroupMessage, function(channel, message) {
        socket.emit('device.change', {
          important: true
        , data: datautil.applyOwner({
              serial: message.serial
            , owner: message.owner
            }
          , user
          )
        })
      })
      .on(wire.LeaveGroupMessage, function(channel, message) {
        socket.emit('device.change', {
          important: true
        , data: datautil.applyOwner({
              serial: message.serial
            , owner: null
            }
          , user
          )
        })
      })
      .on(wire.DeviceStatusMessage, function(channel, message) {
        socket.emit('device.change', {
          important: true
        , data: message
        })
      })
      .on(wire.DeviceIdentityMessage, function(channel, message) {
        datautil.applyData(message)
        message.ready = true
        socket.emit('device.change', {
          important: true
        , data: message
        })
      })
      .on(wire.TransactionProgressMessage, function(channel, message) {
        socket.emit('tx.progress', channel.toString(), message)
      })
      .on(wire.TransactionDoneMessage, function(channel, message) {
        socket.emit('tx.done', channel.toString(), message)
      })
      .on(wire.DeviceLogcatEntryMessage, function(channel, message) {
        socket.emit('logcat.entry', message)
      })
      .on(wire.AirplaneModeEvent, function(channel, message) {
        socket.emit('device.change', {
          important: true
        , data: {
            serial: message.serial
          , airplaneMode: message.enabled
          }
        })
      })
      .on(wire.BatteryEvent, function(channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: false
        , data: {
            serial: serial
          , battery: message
          }
        })
      })
      .on(wire.DeviceBrowserMessage, function(channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: true
        , data: datautil.applyBrowsers({
            serial: serial
          , browser: message
          })
        })
      })
      .on(wire.ConnectivityEvent, function(channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: false
        , data: {
            serial: serial
          , network: message
          }
        })
      })
      .on(wire.PhoneStateEvent, function(channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: false
        , data: {
            serial: serial
          , network: message
          }
        })
      })
      .on(wire.RotationEvent, function(channel, message) {
        socket.emit('device.change', {
          important: false
        , data: {
            serial: message.serial
          , display: {
              rotation: message.rotation
            }
          }
        })
      })
      .handler()

    // Global messages
    //
    // @todo Use socket.io to push global events to all clients instead
    // of listening on every connection, otherwise we're very likely to
    // hit EventEmitter's leak complaints (plus it's more work)
    channelRouter.on(wireutil.global, messageListener)

    // User's private group
    joinChannel(user.group)

    new Promise(function(resolve) {
      socket.on('disconnect', resolve)
        // Touch events
        .on('input.touchDown', createTouchHandler(wire.TouchDownMessage))
        .on('input.touchMove', createTouchHandler(wire.TouchMoveMessage))
        .on('input.touchUp', createTouchHandler(wire.TouchUpMessage))
        .on('input.tap', createTouchHandler(wire.TapMessage))
        // Key events
        .on('input.keyDown', createKeyHandler(wire.KeyDownMessage))
        .on('input.keyUp', createKeyHandler(wire.KeyUpMessage))
        .on('input.keyPress', createKeyHandler(wire.KeyPressMessage))
        .on('input.type', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.TypeMessage(
              data.text
            ))
          ])
        })
        .on('display.rotate', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.RotateMessage(
              data.rotation
            ))
          ])
        })
        // Transactions
        .on('clipboard.paste', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.PasteMessage(data.text)
            )
          ])
        })
        .on('clipboard.copy', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.CopyMessage()
            )
          ])
        })
        .on('device.identify', function(channel, responseChannel) {
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.PhysicalIdentifyMessage()
            )
          ])
        })
        .on('group.invite', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.GroupMessage(
                new wire.OwnerMessage(
                  user.email
                , user.name
                , user.group
                )
              , data.timeout || null
              , wireutil.toDeviceRequirements(data.requirements)
              )
            )
          ])
        })
        .on('group.kick', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.UngroupMessage(
                wireutil.toDeviceRequirements(data.requirements)
              )
            )
          ])
        })
        .on('tx.cleanup', function(channel) {
          leaveChannel(channel)
        })
        .on('tx.punch', function(channel) {
          joinChannel(channel)
          socket.emit('tx.punch', channel)
        })
        .on('shell.command', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ShellCommandMessage(data)
            )
          ])
        })
        .on('shell.keepalive', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.ShellKeepAliveMessage(data))
          ])
        })
        .on('device.install', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.InstallMessage(
                data.href
              , data.launch === true
              , JSON.stringify(data.manifest)
              )
            )
          ])
        })
        .on('device.uninstall', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.UninstallMessage(data)
            )
          ])
        })
        .on('storage.upload', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          request.postAsync({
              url: util.format(
                '%sapi/v1/resources?channel=%s'
              , options.storageUrl
              , responseChannel
              )
            , json: true
            , body: {
                url: data.url
              }
            })
            .catch(function(err) {
              log.error('Storage upload had an error', err.stack)
              leaveChannel(responseChannel)
              socket.emit('tx.cancel', responseChannel, {
                success: false
              , data: 'fail_upload'
              })
            })
        })
        .on('forward.test', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          if (!data.targetHost || data.targetHost === 'localhost') {
            data.targetHost = socket.request.ip
          }
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ForwardTestMessage(data)
            )
          ])
        })
        .on('forward.create', function(channel, responseChannel, data) {
          if (!data.targetHost || data.targetHost === 'localhost') {
            data.targetHost = socket.request.ip
          }
          dbapi.addUserForward(user.email, data)
            .then(function() {
              socket.emit('forward.create', data)
              joinChannel(responseChannel)
              push.send([
                channel
              , wireutil.transaction(
                  responseChannel
                , new wire.ForwardCreateMessage(data)
                )
              ])
            })
        })
        .on('forward.remove', function(channel, responseChannel, data) {
          dbapi.removeUserForward(user.email, data.devicePort)
            .then(function() {
              socket.emit('forward.remove', data)
              joinChannel(responseChannel)
              push.send([
                channel
              , wireutil.transaction(
                  responseChannel
                , new wire.ForwardRemoveMessage(data)
                )
              ])
            })
        })
        .on('logcat.start', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.LogcatStartMessage(data)
            )
          ])
        })
        .on('logcat.stop', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.LogcatStopMessage()
            )
          ])
        })
        .on('browser.open', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.BrowserOpenMessage(data)
            )
          ])
        })
        .on('browser.clear', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.BrowserClearMessage(data)
            )
          ])
        })
        .on('store.open', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.StoreOpenMessage()
            )
          ])
        })
        .on('screen.capture', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ScreenCaptureMessage()
            )
          ])
        })
    })
    .finally(function() {
      // Clean up all listeners and subscriptions
      channelRouter.removeListener(wireutil.global, messageListener)
      channels.forEach(function(channel) {
        channelRouter.removeListener(channel, messageListener)
        sub.unsubscribe(channel)
      })
    })
    .catch(function(err) {
      // Cannot guarantee integrity of client
      log.error(
        'Client had an error, disconnecting due to probable loss of integrity'
      , err.stack
      )

      socket.disconnect(true)
    })


    /*
    socket.on('flick', function(data) {})
    socket.on('back', function(data) {})
    socket.on('forward', function(data) {})
    socket.on('refresh', function(data) {})
    socket.on('internal.relaunch', function(data) {})
    socket.on('internal.clear', function(data) {})
    socket.on('selenium.setCookie', function(data) {})
    socket.on('selenium.deleteCookie', function(data) {})
    socket.on('selenium.deleteAllCookies', function(data) {})
    socket.on('debug.benchmark.pull.start', function(data) {})
    socket.on('debug.benchmark.pull.stop', function(data) {})
    socket.on('logcat', function(data) {})
    socket.on('debug.benchmark.pull.rate', function(data) {})
    socket.on('cpu.monitor.load', function(data) {})

    socket.on('safeExecute', function(data) {})
    socket.on('eval', function(data) {})
    socket.on('safeEval', function(data) {})
    socket.on('executeAsync', function(data) {})
    socket.on('safeExecuteAsync', function(data) {})
    socket.on('execute', function(data) {})
    socket.on('screenshot', function(data) {})
    socket.on('selenium.screenshot', function(data) {})
    socket.on('url', function(data) {})
    socket.on('selenium.allCookies', function(data) {})
    */
    //this._react 'selenium.weinre', =>
    //  this._runTransaction 'selenium.weinre',
    //    targetHost: conf.weinre.httpHost
    //    targetPort: conf.weinre.httpPort
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
