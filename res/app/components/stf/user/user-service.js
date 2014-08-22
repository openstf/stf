module.exports = function UserServiceFactory(AppState) {
  var userService = {}
  userService.currentUser = AppState.user
  return userService
}
