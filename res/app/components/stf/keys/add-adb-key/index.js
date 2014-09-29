require('./add-adb-key.css')

module.exports = angular.module('stf.add-adb-key', [
  require('gettext').name,
  require('stf/common-ui').name
])
  .directive('addAdbKey', require('./add-adb-key-directive'))
  .factory('AdbKeysService', require('./adb-keys-service'))

