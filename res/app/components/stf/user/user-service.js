module.exports = function UserServiceFactory($http, $rootScope, socket) {
  var userService = {}

  userService.user = (function () {
    var userPromise = $http.get('/api/v1/user')
    return function () {
      return userPromise
    }
  })()

  socket.on('forward.create', function(data) {
    userService.user().then(function(user) {
      $rootScope.$apply(function() {
        user.forwards.push(data)
      })
    })
  })

  socket.on('forward.remove', function(data) {
    userService.user().then(function(user) {
      $rootScope.$apply(function() {
        user.forwards = user.forwards.filter(function(forward) {
          return forward.devicePort !== data.devicePort
        })
      })
    })
  })

  return userService
}
