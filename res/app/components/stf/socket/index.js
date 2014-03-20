module.exports = angular.module('stf/socket', [])
  .factory('socket', require('./socket-service'))
  .directive('socketState', require('./socket-state-directive'))
