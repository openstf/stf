module.exports = function UserServiceFactory(
  $rootScope
, socket
, AppState
, AddAdbKeyModalService
) {
  var UserService = {}

  var user = UserService.currentUser = AppState.user

  UserService.getAdbKeys = function() {
    return (user.adbKeys || (user.adbKeys = []))
  }

  UserService.addAdbKey = function(key) {
    socket.emit('user.keys.adb.add', key)
  }

  UserService.acceptAdbKey = function(key) {
    socket.emit('user.keys.adb.accept', key)
  }

  UserService.removeAdbKey = function(key) {
    socket.emit('user.keys.adb.remove', key)
  }

  socket.on('user.keys.adb.added', function(key) {
    UserService.getAdbKeys().push(key)
    $rootScope.$broadcast('user.keys.adb.updated', user.adbKeys)
    $rootScope.$apply()
  })

  socket.on('user.keys.adb.removed', function(key) {
    user.adbKeys = UserService.getAdbKeys().filter(function(someKey) {
      return someKey.fingerprint !== key.fingerprint
    })
    $rootScope.$broadcast('user.keys.adb.updated', user.adbKeys)
    $rootScope.$apply()
  })

  socket.on('user.keys.adb.confirm', function(data) {
    AddAdbKeyModalService.open(data).then(function(result) {
      if (result) {
        UserService.acceptAdbKey(data)
      }
    })
  })

  return UserService
}
