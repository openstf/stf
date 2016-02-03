var http = require('http')
var path = require('path')
var events = require('events')

var express = require('express')
var SwaggerExpress = require('swagger-express-mw')
var cookieSession = require('cookie-session')
var Promise = require('bluebird')
var _ = require('lodash')

var logger = require('../../util/logger')
var zmqutil = require('../../util/zmqutil')
var srv = require('../../util/srv')
var lifecycle = require('../../util/lifecycle')
var wireutil = require('../../wire/util')

module.exports = function(options) {
  var log = logger.createLogger('api')
  var app = express()
  var server = http.createServer(app)
  var channelRouter = new events.EventEmitter()

  var push = zmqutil.socket('push')
  Promise.map(options.endpoints.push, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Sending output to "%s"', record.url)
        push.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to push endpoint', err)
    lifecycle.fatal()
  })

  // Input
  var sub = zmqutil.socket('sub')
  Promise.map(options.endpoints.sub, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Receiving input from "%s"', record.url)
        sub.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to sub endpoint', err)
    lifecycle.fatal()
  })

  // Establish always-on channels
  ;[wireutil.global].forEach(function(channel) {
    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
  })

  sub.on('message', function(channel, data) {
    channelRouter.emit(channel.toString(), channel, data)
  })

  // Swagger Express Config
  var config = {
    appRoot: __dirname
  , swaggerFile: path.resolve(__dirname, 'swagger', 'api_v1.yaml')
  }

  SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) {
      throw err
    }
    swaggerExpress.register(app)
  })

  // Adding options in request, so that swagger controller
  // can use it.
  app.use(function(req, res, next) {
    var reqOptions = _.merge(options, {
      push: push
    , sub: sub
    , channelRouter: channelRouter
    })

    req.options = reqOptions
    next()
  })

  // TODO: Remove this once frontend is stateless
  app.use(cookieSession({
    name: options.ssid
  , keys: [options.secret]
  }))

  lifecycle.observe(function() {
    [push, sub].forEach(function(sock) {
      try {
        sock.close()
      }
      catch (err) {
        // No-op
      }
    })
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
