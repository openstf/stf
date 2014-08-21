require('angular-route')

module.exports = angular.module('stf.fatal-message', [
  require('stf/common-ui/modals/common').name,
  'ngRoute'
])
  .factory('FatalMessageService', require('./fatal-message-service'))
