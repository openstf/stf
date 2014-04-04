var http = require('http')
var util = require('util')
var fs = require('fs')

var express = require('express')
var formidable = require('formidable')
var Promise = require('bluebird')
var ApkReader = require('adbkit-apkreader')
var request = require('request')
var progress = require('request-progress')
var temp = require('temp')
var zmq = require('zmq')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var Storage = require('../../util/storage')
var wire = require('../../wire')
var wireutil = require('../../wire/util')

module.exports = function(options) {
  var log = logger.createLogger('storage-temp')
    , app = express()
    , server = http.createServer(app)
    , storage = new Storage()

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('Sending output to %s', endpoint)
    push.connect(endpoint)
  })

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  storage.on('timeout', function(id) {
    log.info('Cleaning up inactive resource "%s"', id)
  })

  function processFile(file) {
    var resolver = Promise.defer()

    log.info('Processing file "%s"', file.path)

    resolver.progress({
      percent: 0
    })

    process.nextTick(function() {
      try {
        var reader = ApkReader.readFile(file.path)
        var manifest = reader.readManifestSync()
        resolver.resolve(manifest)
      }
      catch (err) {
        err.reportCode = 'fail_invalid_app_file'
        resolver.reject(err)
      }
    })

    return resolver.promise
  }

  function storeFile(file) {
    var id = storage.store(file)
    return Promise.resolve({
      id: id
    , url: util.format(
        'http://%s:%s/api/v1/resources/%s'
      , options.publicIp
      , options.port
      , id
      )
    })
  }

  function download(url) {
    var resolver = Promise.defer()
    var path = temp.path({
      dir: options.saveDir
    })

    log.info('Downloading "%s" to "%s"', url, path)

    function errorListener(err) {
      err.reportCode = 'fail_download'
      resolver.reject(err)
    }

    function progressListener(state) {
      resolver.progress(state)
    }

    function closeListener() {
      resolver.resolve({
        path: path
      })
    }

    resolver.progress({
      percent: 0
    })

    try {
      var req = progress(request(url), {
          throttle: 100 // Throttle events, not upload speed
        })
        .on('progress', progressListener)

      var save = req.pipe(fs.createWriteStream(path))
        .on('error', errorListener)
        .on('close', closeListener)
    }
    catch (err) {
      err.reportCode = 'fail_invalid_url'
      resolver.reject(err)
    }

    return resolver.promise.finally(function() {
      req.removeListener('progress', progressListener)
      save.removeListener('error', errorListener)
      save.removeListener('close', closeListener)
    })
  }

  app.post('/api/v1/resources', function(req, res) {
    function handle(fields, files) {
      var seq = 0

      function sendProgress(data, progress) {
        if (fields.channel) {
          push.send([
            fields.channel
          , wireutil.envelope(new wire.TransactionProgressMessage(
              options.id
            , seq++
            , data
            , progress
            ))
          ])
        }
      }

      function sendDone(success, data, body) {
        if (fields.channel) {
          push.send([
            fields.channel
          , wireutil.envelope(new wire.TransactionDoneMessage(
              options.id
            , seq++
            , success
            , data
            , body ? JSON.stringify(body) : null
            ))
          ])
        }
      }

      if (files.file) {
        return processFile(files.file)
          .progressed(function(progress) {
            sendProgress('processing', 0.9 * progress.percent)
          })
          .then(function(manifest) {
            sendProgress('storing', 90)
            return storeFile(files.file)
              .then(function(data) {
                data.manifest = manifest
                sendDone(true, 'success', data)
                return data
              })
          })
          .catch(function(err) {
            sendDone(false, err.reportCode || 'fail')
            return Promise.reject(err)
          })
      }
      else if (fields.url) {
        return download(fields.url)
          .progressed(function(progress) {
            sendProgress('uploading', 0.7 * progress.percent)
          })
          .then(function(file) {
            return processFile(file)
              .progressed(function(progress) {
                sendProgress('processing', 70 + 0.2 * progress.percent)
              })
              .then(function(manifest) {
                sendProgress('storing', 90)
                return storeFile(file)
                  .then(function(data) {
                    data.manifest = manifest
                    sendDone(true, 'success', data)
                    return data
                  })
              })
          })
          .catch(function(err) {
            sendDone(false, err.reportCode || 'fail')
            return Promise.reject(err)
          })
      }
      else {
        throw new requtil.ValidationError('"file" or "url" is required')
      }
    }

    var form = Promise.promisifyAll(new formidable.IncomingForm())
    form.parseAsync(req)
      .spread(handle)
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
