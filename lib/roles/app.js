var url = require('url')
var http = require('http')
var events = require('events')
var path = require('path')

var express = require('express')
var validator = require('express-validator')
var socketio = require('socket.io')
var zmq = require('zmq')
var Promise = require('bluebird')
var _ = require('lodash')

var logger = require('../util/logger')
var pathutil = require('../util/pathutil')
var wire = require('../wire')
var wireutil = require('../wire/util')
var wirerouter = require('../wire/router')
var dbapi = require('../db/api')
var datautil = require('../util/datautil')

var auth = require('../middleware/auth')
var webpack = require('../middleware/webpack')

var cors = require('cors')

module.exports = function(options) {
  var log = logger.createLogger('app')
    , app = express()
    , server = http.createServer(app)
    , io = socketio.listen(server)
    , channelRouter = new events.EventEmitter()

  app.set('view engine', 'jade')
  app.set('views', pathutil.resource('app/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  io.set('log level', 1)
  io.set('browser client', false)

  app.use(cors())

  app.use('/static/bower_components', express.static(pathutil.resource('bower_components')))
  app.use('/static/data', express.static(pathutil.resource('data')))
  app.use('/static/devices', datautil.middleware())
  app.use('/static', express.static(pathutil.resource('app')))

  if (!options.disableWatch) {
    app.use(webpack)
  }

  app.use(express.cookieParser(options.secret))
  app.use(express.cookieSession({
    key: options.ssid
  }))
  app.use(auth({
    secret: options.secret
  , authUrl: options.authUrl
  }))
  app.use(express.json())
  app.use(express.urlencoded())
  app.use(express.csrf())
  app.use(validator())

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

  app.get('/partials/*', function(req, res) {
    var whitelist = {
      'devices/index': true
    , 'devices/control': true
    , 'devices/screen': true
    }

    if (whitelist.hasOwnProperty(req.params[0])) {
      res.render(path.join('partials', req.params[0]))
    }
    else {
      res.send(404)
    }
  })

  app.get('/', function(req, res) {
    res.render('index')
  })

  app.get('/api/v1/user', function(req, res) {
    res.json({
      success: true
    , user: req.user
    })
  })

  app.get('/api/v1/group', function(req, res) {
    dbapi.loadGroup(req.user.email)
      .then(function(cursor) {
        return Promise.promisify(cursor.toArray, cursor)()
          .then(function(list) {
            list.forEach(function(device) {
              datautil.normalize(device, req.user)
            })
            res.json({
              success: true
            , devices: list
            })
          })
      })
      .catch(function(err) {
        log.error('Failed to load group: ', err.stack)
        res.json(500, {
          success: false
        })
      })
  })

  app.get('/api/v1/devices', function(req, res) {
    dbapi.loadDevices()
      .then(function(cursor) {
        return Promise.promisify(cursor.toArray, cursor)()
          .then(function(list) {
            list.forEach(function(device) {
              datautil.normalize(device, req.user)
            })
            res.json({
              success: true
            , devices: list
            })
          })
      })
      .catch(function(err) {
        log.error('Failed to load device list: ', err.stack)
        res.json(500, {
          success: false
        })
      })
  })

  app.get('/api/v1/devices/:serial', function(req, res) {
    dbapi.loadDevice(req.params.serial)
      .then(function(device) {
        if (device) {
          datautil.normalize(device, req.user)
          res.json({
            success: true
          , device: device
          })
        }
        else {
          res.json(404, {
            success: false
          })
        }
      })
      .catch(function(err) {
        log.error('Failed to load device "%s": ', req.params.serial, err.stack)
        res.json(500, {
          success: false
        })
      })
  })

  io.set('authorization', (function() {
    var parse = Promise.promisify(express.cookieParser(options.secret))
    return function(handshake, accept) {
      parse(handshake, {})
        .then(function() {
          if (handshake.signedCookies[options.ssid]) {
            handshake.session = handshake.signedCookies[options.ssid]
            return dbapi.loadUser(handshake.session.jwt.email)
              .then(function(user) {
                if (user) {
                  handshake.user = user
                  accept(null, true)
                }
                else {
                  accept(null, false)
                }
              })
          }
          else {
            accept(null, false)
          }
        })
        .catch(function(err) {
          accept(null, false)
        })
    }
  })())

  io.on('connection', function(socket) {
    var channels = []
      , user = socket.handshake.user

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

    function createTouchHandler(klass) {
      return function(channel, data) {
        push.send([
          channel
        , wireutil.envelope(new klass(
            data.x
          , data.y
          ))
        ])
      }
    }

    function createKeyHandler(klass) {
      return function(channel, data) {
        push.send([
          channel
        , wireutil.envelope(new klass(
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
          serial: message.serial
        , present: true
        })
      })
      .on(wire.DeviceAbsentMessage, function(channel, message) {
        socket.emit('device.remove', {
          serial: message.serial
        , present: false
        , ready: false
        , lastHeartbeatAt: null
        , using: false
        })
      })
      .on(wire.JoinGroupMessage, function(channel, message) {
        socket.emit('device.change', datautil.applyOwner({
            serial: message.serial
          , owner: message.owner
          }
        , user
        ))
      })
      .on(wire.LeaveGroupMessage, function(channel, message) {
        socket.emit('device.change', datautil.applyOwner({
            serial: message.serial
          , owner: null
          }
        , user
        ))
      })
      .on(wire.DeviceStatusMessage, function(channel, message) {
        socket.emit('device.change', message)
      })
      .on(wire.DeviceIdentityMessage, function(channel, message) {
        datautil.applyData(message)
        message.ready = true
        socket.emit('device.change', message)
      })
      .on(wire.TransactionProgressMessage, function(channel, message) {
        socket.emit('tx.progress', channel.toString(), message)
      })
      .on(wire.TransactionDoneMessage, function(channel, message) {
        socket.emit('tx.done', channel.toString(), message)
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

    new Promise(function(resolve, reject) {
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
        // Transactions
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
              , options.groupTimeout
              , wireutil.toDeviceRequirements(data)
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
                wireutil.toDeviceRequirements(data)
              )
            )
          ])
        })
        .on('tx.cleanup', function(channel) {
          leaveChannel(channel)
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
    socket.on('browser.open', function(data) {})
    socket.on('chrome.open', function(data) {})
    socket.on('browser.clear', function(data) {})
    socket.on('chrome.clear', function(data) {})
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
    socket.on('screen', function(data) {})
    socket.on('screenshot', function(data) {})
    socket.on('selenium.screenshot', function(data) {})
    socket.on('url', function(data) {})
    socket.on('selenium.allCookies', function(data) {})
    socket.on('forward.unset', function(data) {})
    socket.on('forward.list', function(data) {})
    */
    //this._react 'forward.test', (data = {}) =>
    //  this._runTransaction 'forward.test',
    //    this._insertOptionalIp data, 'targetHost'
    //this._react 'forward.set', (data = {}) =>
    //  this._runTransaction 'forward.set',
    //    this._insertOptionalIp data, 'targetHost'
    //this._react 'selenium.weinre', =>
    //  this._runTransaction 'selenium.weinre',
    //    targetHost: conf.weinre.httpHost
    //    targetPort: conf.weinre.httpPort
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
