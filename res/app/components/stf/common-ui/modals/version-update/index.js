module.exports = angular.module('stf.version-update-service', [
  require('stf/common-ui/modals/common').name,
  require('ui-bootstrap').name
])
  .factory('VersionUpdateService', require('./version-update-service'))
