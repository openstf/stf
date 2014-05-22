var Promise = require('bluebird')

module.exports = function StorageServiceFactory($http, $upload) {
  var service = {}

  service.storeUrl = function(type, url) {
    return $http({
      url: '/api/v1/s/' + type + '/download'
    , method: 'POST'
    , data: {
        url: url
      }
    })
  }

  service.storeFile = function(type, files) {
    var resolver = Promise.defer()

    $upload.upload({
        url: '/api/v1/s/' + type
      , method: 'POST'
      , file: files
      })
      .then(
        function(value) {
          resolver.resolve(value)
        }
      , function(err) {
          resolver.reject(err)
        }
      , function(progressEvent) {
          resolver.progress(progressEvent)
        }
      )

    return resolver.promise
  }

  return service
}
