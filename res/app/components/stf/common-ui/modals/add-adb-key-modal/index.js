module.exports = angular.module('stf.add-adb-key-modal', [
  require('stf/common-ui/modals/common').name,
  //require('stf/keys/add-adb-key').name
])
  .factory('AddAdbKeyModalService', require('./add-adb-key-modal-service'))
