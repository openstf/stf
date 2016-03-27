module.exports = function AdbKeysServiceFactory() {
  var service = {}

  service.hostNameFromKey = function(key) {
    if (key.match(/.+= (.+)/)) {
      return key.replace(/.+= (.+)/g, '$1')
    }
    return ''
  }

  return service
}
