var util = require('util')

var Promise = require('bluebird')
var split = require('split')

function NoSuchLineError(message) {
  Error.call(this, message)
  this.name = 'NoSuchLineError'
  Error.captureStackTrace(this, NoSuchLineError)
}

util.inherits(NoSuchLineError, Error)

module.exports.NoSuchLineError = NoSuchLineError

module.exports.readAll = function(stream) {
  var resolver = Promise.defer()
  var collected = new Buffer(0)

  function errorListener(err) {
    resolver.reject(err)
  }

  function endListener() {
    resolver.resolve(collected)
  }

  function readableListener() {
    var chunk
    while ((chunk = stream.read())) {
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
  var piped = stream.pipe(split())

  function errorListener(err) {
    resolver.reject(err)
  }

  function endListener() {
    resolver.reject(new NoSuchLineError())
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

module.exports.talk = function(log, format, stream) {
  stream.pipe(split())
    .on('data', function(chunk) {
      var line = chunk.toString().trim()
      if (line.length) {
        log.info(format, line)
      }
    })
}
