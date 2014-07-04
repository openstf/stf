module.exports = function UserServiceFactory() {
  /*global APPSTATE:false*/
  var userService = {}
  userService.currentUser = APPSTATE.user
  return userService
}
