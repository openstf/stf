var http = require('http')
var util = require('util')
var path = require('path')

var express = require('express')
var formidable = require('formidable')
var Promise = require('bluebird')

var logger = require('../../util/logger')
var Storage = require('../../util/storage')

module.exports = function(options) {
  var log = logger.createLogger('storage:temp')
    , app = express()
    , server = http.createServer(app)
    , storage = new Storage()

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  storage.on('timeout', function(id) {
    log.info('Cleaning up inactive resource "%s"', id)
  })

  app.post('/api/v1/s/:type', function(req, res) {
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
                mapped[file.field] = {
                  date: new Date()
                , type: req.params.type
                , id: file.id
                , name: file.name
                , href: util.format(
                    '/api/v1/s/%s/%s%s'
                  , req.params.type
                  , file.id
                  , file.name
                      ? util.format('/%s', path.basename(file.name))
                      : ''
                  )
                }
              })
              return mapped
            })()
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

  app.get('/api/v1/s/:type/:id/*', function(req, res) {
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
