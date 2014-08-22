module.exports = angular.module('stf/user', [
  require('stf/app-state').name
])
  .factory('UserService', require('./user-service'))
