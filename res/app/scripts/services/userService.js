define(['./module'], function(mod) {
  function UserServiceFactory($http) {
    var userService = {
      info: {}
    }

    $http.get('/api/v1/user')
      .success(function(data) {
        userService.info = data.user
      })

    return userService
  }

  mod.factory('userService', ['$http', UserServiceFactory])
})
