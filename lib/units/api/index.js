var http = require('http')
var path = require('path')

var express = require('express')
var SwaggerExpress = require('swagger-express-mw')
var cookieSession = require('cookie-session')

var logger = require('../../util/logger')

module.exports = function(options) {
  var log = logger.createLogger('api')
    , app = express()
    , server = http.createServer(app)

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
      req.options = options
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
