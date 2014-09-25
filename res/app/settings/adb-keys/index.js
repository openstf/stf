require('./adb-keys.css')

module.exports = angular.module('stf.settings.adb-keys', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put(
      'settings/adb-keys/adb-keys.jade'
      , require('./adb-keys.jade')
    )
  }])
  .controller('AdbKeysCtrl', require('./adb-keys-controller'))
