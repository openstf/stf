var http = require('http')

var express = require('express')
var validator = require('express-validator')
var Promise = require('bluebird')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var jwtutil = require('../../util/jwtutil')
var pathutil = require('../../util/pathutil')
var urlutil = require('../../util/urlutil')
var lifecycle = require('../../util/lifecycle')

module.exports = function(options) {
  var log = logger.createLogger('auth-mock')
    , app = express()
    , server = Promise.promisifyAll(http.createServer(app))

  lifecycle.observe(function() {
    log.info('Waiting for client connections to end')
    return server.closeAsync()
  })

  app.set('view engine', 'jade')
  app.set('views', pathutil.resource('auth-mock/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  app.use(express.cookieParser())
  app.use(express.cookieSession({
    secret: options.secret
  , key: options.ssid
  }))
  app.use(express.json())
  app.use(express.urlencoded())
  app.use(express.csrf())
  app.use(validator())
  app.use('/static/bower_components',
    express.static(pathutil.resource('bower_components')))
  app.use('/static/data', express.static(pathutil.resource('data')))
  app.use('/static', express.static(pathutil.resource('auth-mock')))

  app.use(function(req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken());
    next()
  })

  app.get('/partials/:name', function(req, res) {
    var whitelist = {
      'signin': true
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

  app.post('/api/v1/auth', function(req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
            req.checkBody('name').notEmpty()
            req.checkBody('email').isEmail()
          })
          .then(function() {
            log.info('Authenticated "%s"', req.body.email)
            var token = jwtutil.encode({
              payload: {
                email: req.body.email
              , name: req.body.name
              }
            , secret: options.secret
            })
            res.status(200)
              .json({
                success: true
              , redirect: urlutil.addParams(options.appUrl, {
                  jwt: token
                })
              })
          })
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
              , error: 'ValidationError'
              , validationErrors: err.errors
              })
          })
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
              , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
