require('angular-route')

module.exports = angular.module('stf.large-error-message', [
  require('stf/common-ui/modals/common').name,
  'ngRoute'
])
  .factory('ErrorMessageService', require('./large-error-message-service'))
