var http = require('http')
var util = require('util')
var path = require('path')
var fs = require('fs')

var express = require('express')
var validator = require('express-validator')
var bodyParser = require('body-parser')
var formidable = require('formidable')
var Promise = require('bluebird')
var uuid = require('node-uuid')
var AWS = require('aws-sdk')

var lifecycle = require('../../util/lifecycle')
var logger = require('../../util/logger')
var requtil = require('../../util/requtil')


module.exports = function(options) {
  var log = logger.createLogger('storage:s3')
  , app = express()
  , server = http.createServer(app)
  , credentials = new AWS.SharedIniFileCredentials({
      profile: options.profile
    })

  AWS.config.credentials = credentials;
  var s3 = new AWS.S3(options)

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  app.use(bodyParser.json())
  app.use(validator())

  function putObject(plugin, uriorpath, name) {
    return new Promise(function(resolve, reject) {
      var id = uuid.v4()
      var key = id
      var filename = name? name: path.basename(uriorpath)
      var rs = fs.createReadStream(uriorpath)

      s3.putObject({
        Key: key
      , Body: rs
      , Bucket: options.bucket
      , Metadata: {
          plugin: plugin
        , name: filename
        }
      }, function(err, data) {
        if (err) {
          log.error('failed to store "%s" bucket:"%s"', key, options.bucket)
          log.error(err);
          reject(err);
        } else {
          log.info('Stored "%s" to %s/%s', name, options.bucket, key)
          resolve({
            id: id
          , name: filename
          })
        }
      })
    })
  }

  function getHref(plugin, id, name) {
    return util.format(
      '/s/%s/%s%s'
    , plugin
    , id
    , name ? '/' + path.basename(name) : ''
    )
  }

  app.post('/s/upload/:plugin', function(req, res, next) {
    var form = new formidable.IncomingForm()
    var plugin = req.params.plugin
    Promise.promisify(form.parse, form)(req)
      .spread(function(fields, files) {
        var requests = Object.keys(files).map(function(field) {
          var file = files[field]
          log.info('Uploaded "%s" to "%s"', file.name, file.path)
          return putObject(plugin, file.path, file.name)
            .then(function (obj) {
              return {
                field: field
              , id: obj.id
              , name: obj.name
              , temppath: file.path
              }
            })
        })
        return Promise.all(requests)
      })
      .then(function(storedFiles) {
        res.status(201).json({
          success: true,
          resources: (function() {
            var mapped = Object.create(null)
            storedFiles.forEach(function(file) {
              var plugin = req.params.plugin
              mapped[file.field] = {
                date: new Date()
              , plugin: plugin
              , id: file.id
              , name: file.name
              , href: getHref(plugin, file.id, file.name)
              }
            })
            return mapped
          })()
        })
        return storedFiles
      })
      .then(function (storedFiles){
        storedFiles.forEach(function (file){
          log.debug('cleaned up: %s', file.temppath)
          fs.unlink(file.temppath)
        })
      })
      .catch(function(err) {
        log.error('Error storing resource', err.stack)
        res.status(500)
          .json({
            success: false,
            error: 'ServerError'
          })
      })
  })

  app.get('/s/blob/:id/:name', function(req, res) {
    var params = {
      Key: req.params.id,
      Bucket: options.bucket
    }
    s3.getObject(params, function(err, data) {
      if (err) {
        log.error('failed to retreive[' + path + ']')
        log.error(err, err.stack);
        res.sendStatus(404)
      } else {
        res.set({
          'Content-type': data.ContentType
        })
        res.send(data.Body)
      }
    })
  })

  // initialize
  server.listen(options.port)
  console.log('Listening on port %d', options.port)
}
