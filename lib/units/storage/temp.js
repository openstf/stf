var http = require('http')
var util = require('util')
var path = require('path')

var express = require('express')
var validator = require('express-validator')
var bodyParser = require('body-parser')
var formidable = require('formidable')
var Promise = require('bluebird')
var fs = require('fs')
var uuid = require('uuid')

var logger = require('../../util/logger')
var Storage = require('../../util/storage')
var requtil = require('../../util/requtil')
var download = require('../../util/download')

module.exports = function(options) {
  var log = logger.createLogger('storage:temp')
  var app = express()
  var server = http.createServer(app)
  var storage = new Storage()

  const STORAGE_DIR = options.saveDir

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  app.use(bodyParser.json())
  app.use(validator())

  storage.on('timeout', function(id) {
    log.info('Cleaning up inactive resource "%s"', id)
  })

  app.post('/s/download/:plugin', function(req, res) {
    requtil.validate(req, function() {
        req.checkBody('url').notEmpty()
      })
      .then(function() {
        return download(req.body.url, {
          dir: options.cacheDir
        })
      })
      .then(function(file) {
        return {
          id: storage.store(file)
        , name: file.name
        }
      })
      .then(function(file) {
        var plugin = req.params.plugin
        res.status(201)
          .json({
            success: true
          , resource: {
              date: new Date()
            , plugin: plugin
            , id: file.id
            , name: file.name
            , href: util.format(
                '/s/%s/%s%s'
              , plugin
              , file.id
              , file.name ? util.format('/%s', path.basename(file.name)) : ''
              )
            }
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

  app.post('/s/upload/:plugin', function(req, res) {
    var form = new formidable.IncomingForm({
      maxFileSize: options.maxFileSize
    })
    if (STORAGE_DIR) {
      form.uploadDir = STORAGE_DIR
    }
    Promise.promisify(form.parse, form)(req)
      .spread(function(fields, files) {
        return Object.keys(files).map(function(field) {
          var file = files[field]
          log.info('Uploaded "%s" to "%s"', file.name, file.path)
          return {
            field: field
          , id: storage.store(file)
          , name: file.name
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
                var plugin = req.params.plugin
                mapped[file.field] = {
                  date: new Date()
                , plugin: plugin
                , id: file.id
                , name: file.name
                , href: util.format(
                    '/s/%s/%s%s'
                  , plugin
                  , file.id
                  , file.name ?
                      util.format('/%s', path.basename(file.name)) :
                      ''
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

  // TODO this should be refactored
  app.post('/s/uploadapk/:plugin', function(req, res) {
    var form = new formidable.IncomingForm()

    if (STORAGE_DIR) {
      form.uploadDir = STORAGE_DIR
    }

    const id = uuid.v4()
    const apkDir = path.join(STORAGE_DIR, id)
    form.on('fileBegin', function(name, file) {
      fs.mkdirSync(apkDir)
      file.path = path.join(apkDir, file.name)
    })

    // We expect only one file to be uploaded
    Promise.promisify(form.parse, form)(req)
      .spread(function(fields, files) {
        return Object.keys(files).map(function(field) {
          const file = files[field]
          storage.storeWithId(file, id)
          log.info('Uploaded "%s" to "%s"', file.name, file.path)
          return {
            field: field
            , id: id
            , name: file.name
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
                var plugin = req.params.plugin
                mapped[file.field] = {
                  date: new Date()
                  , plugin: plugin
                  , id: file.id
                  , path: apkDir
                  , href: util.format(
                    '/s/%s/%s%s'
                    , plugin
                    , file.id
                    , file.name ?
                      util.format('/%s', path.basename(file.name)) :
                      ''
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

  app.get('/s/blob/:id/:name', function(req, res) {
    var file = storage.retrieve(req.params.id)
    if (file) {
      if (typeof req.query.download !== 'undefined') {
        res.set('Content-Disposition',
          'attachment; filename="' + path.basename(file.name) + '"')
      }
      res.set('Content-Type', file.type)
      res.sendFile(file.path)
    }
    else {
      res.sendStatus(404)
    }
  })

  app.get('/s/download/report/:id', function(req, res) {
    const fileStorage = storage.retrieve(req.params.id)
    const fileName = 'output.zip'
    const contentType = 'application/zip'

    if (fileStorage) {
      const filePath = path.join(path.dirname(fileStorage.path), fileName)
      if (typeof req.query.download !== 'undefined') {
        res.set('Content-Disposition',
          'attachment; filename="' + fileName + '"')
      }
      res.set('Content-Type', contentType)
      res.set('Content-Disposition', 'attachment; filename=' + fileName)
      res.sendFile(filePath)
    }
    else {
      const file = path.join(STORAGE_DIR, req.params.id, fileName)
      if (fs.existsSync(file)) {
        if (typeof req.query.download !== 'undefined') {
          res.set('Content-Disposition',
            'attachment; filename="' + fileName + '"')
        }
        res.set('Content-Type', contentType)
        res.set('Content-Disposition', 'attachment; filename=' + fileName)
        res.sendFile(file)
      } else {
        res.sendStatus(404)
      }
    }
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
