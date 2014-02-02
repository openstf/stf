var url = require('url')
var http = require('http')
var events = require('events')

var express = require('express')
var validator = require('express-validator')
var socketio = require('socket.io')
var zmq = require('zmq')
var Promise = require('bluebird')

var logger = require('../util/logger')
var pathutil = require('../util/pathutil')
var wire = require('../wire')
var wireutil = require('../wire/util')
var dbapi = require('../db/api')

var auth = require('../middleware/auth')

module.exports = function(options) {
  var log = logger.createLogger('app')
    , app = express()
    , server = http.createServer(app)
    , io = socketio.listen(server)
    , router = new events.EventEmitter()

  app.set('view engine', 'jade')
  app.set('views', pathutil.resource('app/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  io.set('log level', 1)
  io.set('browser client', false)

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
  app.use('/static/lib', express.static(pathutil.resource('lib')))
  app.use('/static', express.static(pathutil.resource('app')))

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
    router.emit(
      channel.toString()
    , channel
    , wire.Envelope.decode(data)
    )
  })

  app.get('/partials/:name', function(req, res) {
    var whitelist = {
      'deviceList': true
    }

    if (whitelist[req.params.name]) {
      res.render('partials/' + req.params.name)
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
    , user: req.session.jwt
    })
  })

  app.get('/api/v1/devices', function(req, res) {
    dbapi.loadDevices()
      .then(function(cursor) {
        return Promise.promisify(cursor.toArray, cursor)()
          .then(function(list) {
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
                handshake.user = user
                accept(null, true)
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
      , group = socket.handshake.user.group

    var messageListener = wirerouter()
      .on(wire.JoinGroupMessage, function(channel, message) {
        socket.emit('join', message)
      })
      .on(wire.LeaveGroupMessage, function(channel, message) {
        socket.emit('leave', message)
      })
      .handler()

    // Global messages
    //
    // @todo Use socket.io to push global events to all clients instead
    // of listening on every connection, otherwise we're very likely to
    // hit EventEmitter's leak complaints (plus it's more work)
    channels.push(wireutil.global)
    router.on(wireutil.global, messageListener)

    // User's private group
    channels.push(group)
    sub.subscribe(group)
    router.on(group, messageListener)

    // Clean up all listeners and subscriptions
    socket.on('disconnect', function() {
      channels.forEach(function(channel) {
        router.removeListener(channel, messageListener)
        sub.unsubscribe(channel)
      })
    })

    socket.on('invite', function(data) {
      push.send([wireutil.global, wireutil.makeGroupMessage(
        group
      , options.groupTimeout
      , data
      )])
    })

    socket.on('kick', function(data) {
      push.send([group, wireutil.makeUngroupMessage(
        group
      , data
      )])
    })

    socket.on('flick', function(data) {})
    socket.on('back', function(data) {})
    socket.on('forward', function(data) {})
    socket.on('refresh', function(data) {})
    socket.on('monkey.touchDown', function(data) {})
    socket.on('monkey.touchMove', function(data) {})
    socket.on('monkey.touchUp', function(data) {})
    socket.on('monkey.keyDown', function(data) {})
    socket.on('monkey.keyUp', function(data) {})
    socket.on('monkey.press', function(data) {})
    socket.on('monkey.type', function(data) {})
    socket.on('monkey.back', function(data) {})
    socket.on('monkey.home', function(data) {})
    socket.on('monkey.menu', function(data) {})
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
