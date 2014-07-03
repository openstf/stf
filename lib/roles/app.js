var http = require('http')
var path = require('path')

var express = require('express')
var validator = require('express-validator')
var cookieSession = require('cookie-session')
var bodyParser = require('body-parser')
var serveFavicon = require('serve-favicon')
var serveStatic = require('serve-static')
var csrf = require('csurf')
var Promise = require('bluebird')
var httpProxy = require('http-proxy')
var compression = require('compression')

var logger = require('../util/logger')
var pathutil = require('../util/pathutil')
var dbapi = require('../db/api')
var datautil = require('../util/datautil')

var auth = require('./app/middleware/auth')
var webpack = require('./app/middleware/webpack')
var deviceIconMiddleware = require('./app/middleware/device-icons')
var browserIconMiddleware = require('./app/middleware/browser-icons')

module.exports = function(options) {
  var log = logger.createLogger('app')
    , app = express()
    , server = http.createServer(app)
    , proxy = httpProxy.createProxyServer()

  proxy.on('error', function(err) {
    log.error('Proxy had an error', err.stack)
  })

  app.set('view engine', 'jade')
  app.set('views', pathutil.resource('app/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  if (options.disableWatch) {
    app.use(compression())
    app.use('/static/build/entry',
      serveStatic(pathutil.resource('build/entry')))
    app.use('/static/build', serveStatic(pathutil.resource('build'), {
      maxAge: '10d'
    }))
  } else {
    app.use('/static/build', webpack({
      debug: true
      , devtool: 'eval'
      , stats: {
          colors: true
        }
    }))
  }

  app.use('/static/bower_components',
    serveStatic(pathutil.resource('bower_components')))
  app.use('/intro',
    serveStatic(pathutil.resource('bower_components/stf-site/intro')))
  app.use('/manual-basic',
    serveStatic(pathutil.resource('bower_components/stf-site/manual/basic')))
  app.use('/manual-advanced',
    serveStatic(pathutil.resource('bower_components/stf-site/manual/advanced')))
  app.use('/v2-features',
    serveStatic(pathutil.resource('bower_components/stf-site/v2-features')))
  app.use('/static/data', serveStatic(pathutil.resource('data')))
  app.use('/static/status', serveStatic(pathutil.resource('common/status')))
  app.use('/static/browsers', browserIconMiddleware())
  app.use('/static/devices', deviceIconMiddleware())
  app.use('/static', serveStatic(pathutil.resource('app')))

  app.use(serveFavicon(pathutil.resource(
    'bower_components/stf-graphics/logo/exports/STF-128.png')))

  app.use(cookieSession({
    name: options.ssid
  , keys: [options.secret]
  }))

  app.use(auth({
    secret: options.secret
  , authUrl: options.authUrl
  }))

  // Variables for templates
  app.locals.APPSTATE = {
    config: {
      websocketUrl: options.websocketUrl
    }
  }

  // Proxied requests must come before any body parsers. These proxies are
  // here mainly for convenience, they should be replaced with proper reverse
  // proxies in production.
  app.all('/api/v1/s/image/*', function(req, res) {
    proxy.web(req, res, {
      target: options.storagePluginImageUrl
    })
  })

  app.all('/api/v1/s/apk/*', function(req, res) {
    proxy.web(req, res, {
      target: options.storagePluginApkUrl
    })
  })

  app.all('/api/v1/s/*', function(req, res) {
    proxy.web(req, res, {
      target: options.storageUrl
    })
  })

  app.use(bodyParser.json())
  app.use(csrf())
  app.use(validator())

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

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
