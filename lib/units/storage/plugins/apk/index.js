var http = require('http')
var url = require('url')

var express = require('express')
var httpProxy = require('http-proxy')

var logger = require('../../../../util/logger')
var download = require('../../../../util/download')
var manifest = require('./task/manifest')

module.exports = function(options) {
  var log = logger.createLogger('storage:plugins:apk')
    , app = express()
    , server = http.createServer(app)
    , proxy = httpProxy.createProxyServer()

  proxy.on('error', function(err) {
    log.error('Proxy had an error', err.stack)
  })

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  app.get('/s/api/v1/apk/:id/*/manifest', function(req, res) {
    download(url.resolve(options.storageUrl, req.url), {
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

  app.get('/s/api/v1/apk/:id/*', function(req, res) {
    proxy.web(req, res, {
      target: options.storageUrl
    })
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
