var url = require('url')

var express = require('express')
var validator = require('express-validator')

var logger = require('../util/logger')
var pathutil = require('../util/pathutil')

var auth = require('../middleware/auth')

module.exports = function(options) {
  var log = logger.createLogger('app')
    , app = express()

  app.set('view engine', 'jade')
  app.set('views', pathutil.resource('app/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  app.use(express.cookieParser())
  app.use(express.cookieSession({
    secret: options.secret
  , key: options.ssid
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

  app.get('/', function(req, res) {
    res.render('index')
  })

  app.listen(options.port)
  log.info('Listening on port %d', options.port)
}
