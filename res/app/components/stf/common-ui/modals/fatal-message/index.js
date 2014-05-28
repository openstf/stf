module.exports = angular.module('stf.fatal-message', [
  require('stf/common-ui/modals/common').name
])
  .factory('FatalMessageService', require('./fatal-message-service'))
