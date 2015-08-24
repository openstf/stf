var http = require('http')
var util = require('util')
var path = require('path')

var express = require('express')
var validator = require('express-validator')
var bodyParser = require('body-parser')
var formidable = require('formidable')
var Promise = require('bluebird')
var uuid = require('node-uuid')
var fs = require('fs')

var logger = require('../../util/logger')
var Storage = require('../../util/storage')
var requtil = require('../../util/requtil')
var download = require('../../util/download')

var AWS = require('aws-sdk')
var fs = require('fs');

module.exports = function(options) {
  var log = logger.createLogger('storage:s3')
    , app = express()
    , server = http.createServer(app)
    , credentials = new AWS.SharedIniFileCredentials({
        profile: options.profile})
    , bucket = options.Bucket
    , s3

  log.debug(options)

  AWS.config.credentials = credentials;
  s3 = new AWS.S3(options)

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  app.use(bodyParser.json())
  app.use(validator())

  function makePutParams(id, path, name) {
    var key = id + name
          ? util.format('/%s', name)
          : ''
      , rs = fs.createReadStream(path)
    return {
      Bucket: bucket
    , Key: key
    , Body: rs
    }
  }

  app.post('/s/download/:plugin', function(req, res) {
    requtil.validate(req, function() {
        req.checkBody('url').notEmpty()
      })
    .then(function() {
      return download(req.body.url, {
	dir: options.cahedir
      })
    })
    .then(function(file){
      return new Promise(function(resolve, reject) {
	var id = uuid.v4()
        , params = makePutParams(id, file.path)
	s3.putObject(params, function(err, data) {
	  if (err)  {
	    log.err('failed to store "%s"', params.Key);
	    reject(err)
	  } else {
	    resolve({
	      id: id
	    , name: file.name
	    })
	  }
	})
      })
    })
    .then(function(file){
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
	      , file.name
                ? util.format('/%s', path.basename(file.name))
                : ''
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
    var form = new formidable.IncomingForm()
    var plugin = req.params.plugin
    Promise.promisify(form.parse, form)(req)
      .spread(function(fields, files) {
	var requests = Object.keys(files).map(function(field) {
          var file = files[field]
          log.info('Uploaded "%s" to "%s"', file.name, file.path)

	  return new Promise(function(resolve, reject) {
	    var id = uuid.v4()
	      , key = id + '/' + file.name
	      , rs = fs.createReadStream(file.path)
	      , params = {
	        Key: key
		, Body: rs
		, Bucket: bucket
		, Metadata: {
		  field: field
		  , plugin: plugin
	        }
	    };
	    s3.putObject(params, function(err, data) {
	      if (err) {
		log.error('failed to store "%s" bucket:"%s"', 
			  key, bucket)
		log.error(err);
		reject(err);
	      } else {
		log.info('Stored "%s" to %s/%s/%s', file.name,
			bucket, id, file.name)
		resolve({
		    field: field
		  , id: id
		  , name: file.name
		});
	      }
	    });
	  });
        });
        return Promise.all(requests)
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
		    , file.name
		        ? util.format('/%s', path.basename(file.name))
		        : ''
		  )
		}
	      })
	      return mapped;
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
  });

  app.get('/s/blob/:id/:name', function(req, res) {
    var path = util.format('%s/%s', req.params.id, req.params.name)
    var params = {
         Key: path
      ,  Bucket: bucket
    };
    s3.getObject(params, function(err, data) {
      if (err)  {
	log.error('failed to retreive[' + path + ']')
	log.error(err, err.stack);
	res.sendStatus(404)
      } else {
	res.set({
	  'Content-type': data.ContentType
	});
	res.send(data.Body);
      }
    });
  });

  server.listen(options.port)
  console.log('Listening on port %d', options.port)
}

