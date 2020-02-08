module.exports = angular.module('stf/user', [
  require('stf/socket').name,
  require('stf/common-ui').name,
  require('stf/app-state').name
])
  .factory('UserService', require('./user-service'))
