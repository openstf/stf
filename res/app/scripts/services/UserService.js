define(['./_module'], function(app) {
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

  app.factory('UserService', ['$http', UserServiceFactory])
})
