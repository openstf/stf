module.exports = angular.module('stf.version-update', [
  require('stf/common-ui/modals/common').name
])
  .factory('VersionUpdateService', require('./version-update-service'))
