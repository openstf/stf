var Promise = require('bluebird')
var split = require('split')

module.exports.readAll = function(stream) {
  var resolver = Promise.defer()
    , collected = new Buffer(0)

  function errorListener(err) {
    resolver.reject(err)
  }

  function endListener() {
    resolver.resolve(collected)
  }

  function readableListener() {
    var chunk;
    while (chunk = stream.read()) {
      collected = Buffer.concat([collected, chunk])
    }
  }

  stream.on('error', errorListener)
  stream.on('readable', readableListener)
  stream.on('end', endListener)

  return resolver.promise.finally(function() {
    stream.removeListener('error', errorListener)
    stream.removeListener('readable', readableListener)
    stream.removeListener('end', endListener)
  })
}


module.exports.findLine = function(stream, re) {
  var resolver = Promise.defer()
    , piped = stream.pipe(split())

  function errorListener(err) {
    resolver.reject(err)
  }

  function endListener() {
    resolver.reject(new Error('No matching line found'))
  }

  function lineListener(line) {
    if (re.test(line)) {
      resolver.resolve(line)
    }
  }

  piped.on('error', errorListener)
  piped.on('data', lineListener)
  piped.on('end', endListener)

  return resolver.promise.finally(function() {
    piped.removeListener('error', errorListener)
    piped.removeListener('data', lineListener)
    piped.removeListener('end', endListener)
    stream.unpipe(piped)
  })
}
