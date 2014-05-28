module.exports = angular.module('stf/socket', [
  require('stf/common-ui/modals/version-update').name
])
  .factory('socket', require('./socket-service'))
