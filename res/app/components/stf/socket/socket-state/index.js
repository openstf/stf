module.exports = angular.module('stf/socket/socket-state', [
  require('stf/socket').name,
  require('stf/common-ui/notifications').name
])
  .directive('socketState', require('./socket-state-directive'))
  .controller('SocketStateCtrl', require('./socket-state-controller'))
