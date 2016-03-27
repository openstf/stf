require('./device-settings.css')

module.exports = angular.module('stf.device-settings', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/automation/device-settings/device-settings.jade',
      require('./device-settings.jade')
    )
  }])
  .controller('DeviceSettingsCtrl', require('./device-settings-controller'))
