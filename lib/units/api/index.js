var http = require('http')
var path = require('path')

var express = require('express')
var SwaggerExpress = require('swagger-express-mw')
var cookieSession = require('cookie-session')
var Promise = require('bluebird')
var _ = require('lodash')

var logger = require('../../util/logger')
var zmqutil = require('../../util/zmqutil')
var srv = require('../../util/srv')
var lifecycle = require('../../util/lifecycle')

module.exports = function(options) {
  var log = logger.createLogger('api')
    , app = express()
    , server = http.createServer(app)

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

  var config = {
    appRoot: __dirname
  , swaggerFile: path.resolve(__dirname, 'swagger', 'api_v1.yaml')
  };

  SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) { throw err; }
    swaggerExpress.register(app);
  })

  // Adding options in request, so that swagger controller
  // can use it.
  app.use(function(req, res, next) {
    var reqOptions = _.merge(options, {
      'push': push
    })

    req.options = reqOptions
    next()
  })

  // TODO: Remove this once frontend is stateless
  app.use(cookieSession({
    name: options.ssid
  , keys: [options.secret]
  }))

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
