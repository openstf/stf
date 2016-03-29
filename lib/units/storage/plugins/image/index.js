var http = require('http')
var util = require('util')

var express = require('express')

var logger = require('../../../../util/logger')
var requtil = require('../../../../util/requtil')

var parseCrop = require('./param/crop')
var parseGravity = require('./param/gravity')
var get = require('./task/get')
var transform = require('./task/transform')

module.exports = function(options) {
  var log = logger.createLogger('storage:plugins:image')
  var app = express()
  var server = http.createServer(app)

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  app.get(
    '/s/image/:id/:name'
  , requtil.limit(options.concurrency, function(req, res) {
      var orig = util.format(
        '/s/blob/%s/%s'
      , req.params.id
      , req.params.name
      )
      return get(orig, options)
        .then(function(stream) {
          return transform(stream, {
            crop: parseCrop(req.query.crop)
          , gravity: parseGravity(req.query.gravity)
          })
        })
        .then(function(out) {
          res.status(200)

          if (typeof req.query.download !== 'undefined') {
            res.set('Content-Disposition',
              'attachment; filename="' + req.params['0'] + '"')
          }

          out.pipe(res)
        })
        .catch(function(err) {
          log.error(
            'Unable to transform resource "%s"'
          , req.params.id
          , err.stack
          )
          res.status(500)
            .json({
              success: false
            })
        })
    })
  )

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
