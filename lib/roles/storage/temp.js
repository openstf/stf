var http = require('http')
var util = require('util')
var fs = require('fs')

var express = require('express')
var formidable = require('formidable')
var Promise = require('bluebird')
var ApkReader = require('adbkit-apkreader')
var request = require('request')
var temp = require('temp')

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

  function process(file) {
    log.info('Processing "%s"', file.path)

    var reader = ApkReader.readFile(file.path)
    var manifest = reader.readManifestSync()
    var id = storage.store(file)

    return {
      url: util.format(
        'http://%s:%s/api/v1/resources/%s'
      , options.publicIp
      , options.port
      , id
      )
    , manifest: manifest
    }
  }

  function download(url) {
    var resolver = Promise.defer()
    var path = temp.path({
      dir: options.saveDir
    })

    log.info('Downloading "%s" to "%s"', url, path)

    function errorListener(err) {
      resolver.reject(err)
    }

    function closeListener() {
      resolver.resolve({
        path: path
      })
    }

    try {
      var dl = request(url)
        .pipe(fs.createWriteStream(path))
        .on('error', errorListener)
        .on('close', closeListener)
    }
    catch (err) {
      resolver.reject(err)
    }

    return resolver.promise.finally(function() {
      dl.removeListener('error', errorListener)
      dl.removeListener('close', closeListener)
    })
  }

  app.post('/api/v1/resources', function(req, res) {
    var form = Promise.promisifyAll(new formidable.IncomingForm())
    form.parseAsync(req)
      .spread(function(fields, files) {
        if (files.file) {
          return process(files.file)
        }
        else if (fields.url) {
          return download(fields.url).then(process)
        }
        else {
          throw new requtil.ValidationError('"file" or "url" is required')
        }
      })
      .then(function(data) {
        data.success = true
        res.json(201, data)
      })
      .catch(requtil.ValidationError, function() {
        res.json(400, {
          success: false
        , error: 'ValidationError'
        })
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
