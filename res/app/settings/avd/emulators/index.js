require('./avd-info.css')

module.exports = angular.module('stf.settings.avd.emulators', [
  require('stf/common-ui').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/avd/emulators/avd-emulator-info.pug', require('./avd-emulator-info.pug')
    )
  }])
  .controller('AvdEmulatorCtrl', require('./avd-emulator-info-controller'))
