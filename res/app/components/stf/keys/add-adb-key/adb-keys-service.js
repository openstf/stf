module.exports = function AdbKeysServiceFactory() {
  var service = {}

  service.hostNameFromKey = function (key) {
    if (key.match(/.+= (.+)/)) {
      return key.replace(/.+= (.+)/g, '$1').replace(/(\.local)?/g, '')
    }
    return ''
  }

  return service
}
