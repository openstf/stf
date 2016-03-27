require('./adb-keys.css')

module.exports = angular.module('stf.settings.keys.adb-keys', [
  require('stf/common-ui').name,
  require('stf/keys/add-adb-key').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/keys/adb-keys/adb-keys.jade', require('./adb-keys.jade')
    )
  }])
  .controller('AdbKeysCtrl', require('./adb-keys-controller'))
