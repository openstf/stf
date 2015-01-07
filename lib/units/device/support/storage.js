var util = require('util')
var url = require('url')

var syrup = require('stf-syrup')
var Promise = require('bluebird')
var request = require('request')

var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .define(function(options) {
    var log = logger.createLogger('device:support:storage')
    var plugin = Object.create(null)

    plugin.store = function(type, stream, meta) {
      var resolver = Promise.defer()

      var args = {
        url: url.resolve(options.storageUrl, util.format('s/upload/%s', type))
      }

      var req = request.post(args, function(err, res, body) {
        if (err) {
          log.error('Upload to "%s" failed', args.url, err.stack)
          resolver.reject(err)
        }
        else if (res.statusCode !== 201) {
          log.error('Upload to "%s" failed: HTTP %d', args.url, res.statusCode)
          resolver.reject(new Error(util.format(
            'Upload to "%s" failed: HTTP %d'
          , args.url
          , res.statusCode
          )))
        }
        else {
          try {
            var result = JSON.parse(body)
            log.info('Uploaded to "%s"', result.resources.file.href)
            resolver.resolve(result.resources.file)
          }
          catch (err) {
            log.error('Invalid JSON in response', err.stack, body)
            resolver.reject(err)
          }
        }
      })

      req.form()
        .append('file', stream, meta)

      return resolver.promise
    }

    return plugin
  })
