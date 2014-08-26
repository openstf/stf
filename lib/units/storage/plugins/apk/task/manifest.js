var Promise = require('bluebird')
var ApkReader = require('adbkit-apkreader')

module.exports = function(file) {
  var resolver = Promise.defer()

  process.nextTick(function() {
    try {
      var reader = ApkReader.readFile(file.path)
      var manifest = reader.readManifestSync()
      resolver.resolve(manifest)
    }
    catch (err) {
      resolver.reject(err)
    }
  })

  return resolver.promise
}
