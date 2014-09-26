require('./adb-keys.css')

module.exports = angular.module('stf.settings.adb-keys', [
  require('stf/common-ui/nothing-to-show').name,
  require('stf/browser-info').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put(
      'settings/adb-keys/adb-keys.jade', require('./adb-keys.jade')
    )
  }])
  .controller('AdbKeysCtrl', require('./adb-keys-controller'))
  .factory('AdbKeysService', require('./adb-keys-service'))

