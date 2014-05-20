var http = require('http')
var util = require('util')

var express = require('express')
var Promise = require('bluebird')
var gm = require('gm')

var logger = require('../../../../util/logger')

var parseCrop = require('./param/crop')
var parseGravity = require('./param/gravity')
var get = require('./task/get')
var transform = require('./task/transform')

module.exports = function(options) {
  var log = logger.createLogger('storage:plugins:image')
    , app = express()
    , server = http.createServer(app)

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  app.get('/api/v1/resources/:id/*', function(req, res) {
    get(req.params.id, options)
      .then(function(stream) {
        return transform(stream, {
          crop: parseCrop(req.query.crop)
        , gravity: parseGravity(req.query.gravity)
        })
      })
      .then(function(out) {
        res.status(200)
        out.pipe(res)
      })
      .catch(function(err) {
        log.error('Unable to transform resource "%s"', req.params.id, err.stack)
        res.status(500)
          .json({
            success: false
          })
      })
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
