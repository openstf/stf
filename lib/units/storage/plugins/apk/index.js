var http = require('http')
var url = require('url')
var util = require('util')

var express = require('express')
var request = require('request')

var logger = require('../../../../util/logger')
var download = require('../../../../util/download')
var manifest = require('./task/manifest')

module.exports = function(options) {
  var log = logger.createLogger('storage:plugins:apk')
  var app = express()
  var server = http.createServer(app)

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  app.get('/s/apk/:id/:name/manifest', function(req, res) {
    var orig = util.format(
      '/s/blob/%s/%s'
    , req.params.id
    , req.params.name
    )
    download(url.resolve(options.storageUrl, orig), {
        dir: options.cacheDir
      })
      .then(manifest)
      .then(function(data) {
        res.status(200)
          .json({
            success: true
          , manifest: data
          })
      })
      .catch(function(err) {
        log.error('Unable to read manifest of "%s"', req.params.id, err.stack)
        res.status(500)
          .json({
            success: false
          })
      })
  })

  app.get('/s/apk/:id/:name', function(req, res) {
    request(url.resolve(options.storageUrl, util.format(
      '/s/blob/%s/%s'
    , req.params.id
    , req.params.name
    )))
    .pipe(res)
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
