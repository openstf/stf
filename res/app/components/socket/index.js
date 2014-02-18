require('angular')

module.exports = angular.module('socket', [])
  .factory('SocketService', require('./socket-service'));
