require('./save-log.css')

require('angular-route')

module.exports = angular.module('stf.save-log-message', [
  require('stf/common-ui/modals/common').name,
  'ngRoute'
])
  .factory('SaveLogService', require('./save-log-service'))
