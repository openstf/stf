module.exports = angular.module('stf/group', [
  require('stf/socket').name,
  require('stf/user').name
])
  .factory('GroupService', require('./group-service'))