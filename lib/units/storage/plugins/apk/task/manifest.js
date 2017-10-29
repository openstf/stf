var ApkReader = require('adbkit-apkreader')

module.exports = function(file) {
  return ApkReader.open(file.path).then(function(reader) {
    return reader.readManifest()
  })
}
