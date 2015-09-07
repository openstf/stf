module.exports = angular.module('stf.add-adb-key-modal', [
  require('stf/common-ui/modals/common').name
])
  .factory('AddAdbKeyModalService', require('./add-adb-key-modal-service'))
