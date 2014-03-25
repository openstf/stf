var http = require('http')
var util = require('util')

var express = require('express')
var formidable = require('formidable')
var Promise = require('bluebird')
var ApkReader = require('adbkit-apkreader')

var logger = require('../../util/logger')
var Storage = require('../../util/storage')

module.exports = function(options) {
  var log = logger.createLogger('storage-temp')
    , app = express()
    , server = http.createServer(app)
    , storage = new Storage()

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  app.use(express.json())
  app.use(express.urlencoded())

  storage.on('timeout', function(id) {
    log.info('Cleaning up inactive resource "%s"', id)
  })

  app.post('/api/v1/resources', function(req, res) {
    var form = Promise.promisifyAll(new formidable.IncomingForm())
    form.parseAsync(req)
      .spread(function(fields, files) {
        if (files.file) {
          try {
            var reader = ApkReader.readFile(files.file.path)
            var manifest = reader.readManifestSync()
            var id = storage.store(files.file)
            res.json(201, {
              success: true
            , url: util.format(
                'http://%s:%s/api/v1/resources/%s'
              , options.publicIp
              , options.port
              , id
              )
            , manifest: manifest
            })
          }
          catch (err) {
            log.error('ApkReader had an error', err.stack)
            res.json(500, {
              success: false
            })
          }
        }
        else {
          res.json(400, {
            success: false
          })
        }
      })
      .catch(function(err) {
        log.error('Failed to save resource: ', err.stack)
        res.json(500, {
          success: false
        })
      })
  })

  app.get('/api/v1/resources/:id', function(req, res) {
    var file = storage.retrieve(req.params.id)
    if (file) {
      res.set('Content-Type', file.type)
      res.sendfile(file.path)
    }
    else {
      res.send(404)
    }
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
