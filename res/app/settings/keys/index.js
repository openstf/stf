require('./keys.css')

module.exports = angular.module('stf.settings.keys', [
  require('./adb-keys').name,
  require('./access-tokens').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/keys/keys.jade', require('./keys.jade')
    )
  }])
  .controller('KeysCtrl', require('./keys-controller'))
