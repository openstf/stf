define(['./_module'], function(services) {
  function UserServiceFactory($http) {
    var userService = {
    }

    userService.user = (function() {
      var userPromise = $http.get('/api/v1/user')
      return function() {
        return userPromise
      }
    })()

    return userService
  }

  services.factory('UserService', ['$http', UserServiceFactory])
})
