var http = require('http')
var util = require('util')
var path = require('path')

var express = require('express')
var formidable = require('formidable')
var Promise = require('bluebird')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var Storage = require('../../util/storage')

module.exports = function(options) {
  var log = logger.createLogger('storage-temp')
    , app = express()
    , server = http.createServer(app)
    , storage = new Storage()

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  storage.on('timeout', function(id) {
    log.info('Cleaning up inactive resource "%s"', id)
  })

  app.post('/api/v1/resources', function(req, res) {
    var form = new formidable.IncomingForm()
    Promise.promisify(form.parse, form)(req)
      .spread(function(fields, files) {
        return Object.keys(files).map(function(field) {
          return {
            field: field
          , id: storage.store(files[field])
          , name: files[field].name
          }
        })
      })
      .then(function(storedFiles) {
        res.status(201)
          .json({
            success: true
          , resources: (function() {
              var mapped = Object.create(null)
              storedFiles.forEach(function(file) {
                mapped[file.field] = util.format(
                  'http://%s:%s/api/v1/resources/%s%s'
                , options.publicIp
                , options.port
                , file.id
                , file.name
                    ? util.format('/%s', path.basename(file.name))
                    : ''
                )
              })
              return mapped
            })()
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
        log.error('Error storing resource', err.stack)
        res.status(500)
          .json({
            success: false
          , error: 'ServerError'
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

  app.get('/api/v1/resources/:id/*', function(req, res) {
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
