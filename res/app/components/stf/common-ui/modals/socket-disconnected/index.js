module.exports = angular.module('stf.socket-disconnected', [
  require('stf/common-ui/modals/common').name
])
  .factory('SocketDisconnectedService', require('./socket-disconnected-service'))
