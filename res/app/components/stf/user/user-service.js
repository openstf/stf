module.exports = function UserServiceFactory($http, $rootScope, socket, $timeout) {
  var userService = {}

  userService.currentUser = (function () {
    var userPromise = $http.get('/api/v1/user')
      .then(function(response) {
        if (!response.data.success) {
          throw new Error('Unable to get user data')
        }
        return response.data.user
      })
    return function () {
      return userPromise
    }
  })()

  // TODO: Disabled for now
//  socket.on('forward.create', function (data) {
//    userService.user().then(function (user) {
//      $timeout(function () {
//        user.forwards.push(data)
//      })
//    })
//  })
//
//  socket.on('forward.remove', function (data) {
//    userService.user().then(function (user) {
//      $timeout(function () {
//        user.forwards = user.forwards.filter(function (forward) {
//          return forward.devicePort !== data.devicePort
//        })
//      })
//    })
//  })

  return userService
}
