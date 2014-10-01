module.exports = function UserServiceFactory($http, AppState) {
  var UserService = {}

  var user = UserService.currentUser = AppState.user

  UserService.getAdbKeys = function() {
    return (user.adbKeys || (user.adbKeys = []))
  }

  UserService.addAdbKey = function(key) {
    return $http.post('/api/v1/app/user/keys/adb', key)
      .success(function(data) {
        UserService.getAdbKeys().push(data.key)
      })
  }

  UserService.removeAdbKey = function(key) {
    return $http.delete('/api/v1/app/user/keys/adb/' + key.fingerprint)
      .success(function() {
        user.adbKeys = UserService.getAdbKeys().filter(function(someKey) {
          return someKey.fingerprint !== key.fingerprint
        })
      })
  }

  return UserService
}
