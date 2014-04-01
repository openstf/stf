var http = require('http')
var util = require('util')

var syrup = require('syrup')
var express = require('express')

var logger = require('../../../util/logger')

module.exports = syrup()
  .define(function(options) {
    var log = logger.createLogger('device:support:http')
      , port = options.ports.pop()
      , app = express()
      , server = http.createServer(app)

    app.set('strict routing', true)
    app.set('case sensitive routing', true)
    app.set('public url', util.format(
      'http://%s:%s'
    , options.publicIp
    , port
    ))

    server.listen(port)

    log.info('Listening on %s', app.get('public url'))

    return app
  })
