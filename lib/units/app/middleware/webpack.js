var path = require('path')
var url = require('url')

var webpack = require('webpack')
var mime = require('mime')
var Promise = require('bluebird')
var _ = require('lodash')
var MemoryFileSystem = require('memory-fs')

var logger = require('../../../util/logger')
var lifecycle = require('../../../util/lifecycle')
var globalOptions = require('../../../../webpack.config').webpack

// Similar to webpack-dev-middleware, but integrates with our custom
// lifecycle, behaves more like normal express middleware, and removes
// all unnecessary features.
module.exports = function(localOptions) {
  var log = logger.createLogger('middleware:webpack')
  var options = _.defaults(localOptions || {}, globalOptions)

  var compiler = webpack(options)
  var fs = compiler.outputFileSystem = new MemoryFileSystem()

  var valid = false
  var queue = []

  log.info('Creating bundle')
  var watching = compiler.watch(options.watchDelay, function(err) {
    if (err) {
      log.fatal('Webpack had an error', err.stack)
      lifecycle.fatal()
    }
  })

  lifecycle.observe(function() {
    if (watching.watcher) {
      watching.watcher.close()
    }
  })

  function doneListener(stats) {
    process.nextTick(function() {
      if (valid) {
        log.info(stats.toString(options.stats))

        if (stats.hasErrors()) {
          log.error('Bundle has errors')
        }
        else if (stats.hasWarnings()) {
          log.warn('Bundle has warnings')
        }
        else {
          log.info('Bundle is now valid')
        }

        queue.forEach(function(resolver) {
          resolver.resolve()
        })
      }
    })

    valid = true
  }

  function invalidate() {
    if (valid) {
      log.info('Bundle is now invalid')
      valid = false
    }
  }

  compiler.plugin('done', doneListener)
  compiler.plugin('invalid', invalidate)
  compiler.plugin('compile', invalidate)

  function bundle() {
    if (valid) {
      return Promise.resolve()
    }

    log.info('Waiting for bundle to finish')
    var resolver = Promise.defer()
    queue.push(resolver)
    return resolver.promise
  }

  return function(req, res, next) {
    var parsedUrl = url.parse(req.url)

    var target = path.join(
      compiler.outputPath
    , parsedUrl.pathname
    )

    bundle()
      .then(function() {
        try {
          var body = fs.readFileSync(target)
          res.set('Content-Type', mime.lookup(target))
          res.end(body)
        }
        catch (err) {
          return next()
        }
      })
      .catch(next)
  }
}
