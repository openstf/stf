require('./add-adb-key.css')

module.exports = angular.module('stf.add-adb-key', [
  require('gettext').name,
  require('stf/common-ui').name
])
  .directive('addAdbKey', require('./add-adb-key-directive'))
  .controller('addAdbKeyCtrl', require('./add-adb-key-controller.js'))
  .factory('AdbKeysService', require('./adb-keys-service'))

