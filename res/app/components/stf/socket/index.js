module.exports = angular.module('stf.socket', [
  //TODO: Refactor version update out to its own Ctrl
  require('stf/app-state').name,
  require('stf/common-ui/modals/version-update').name
])
  .factory('socket', require('./socket-service'))
