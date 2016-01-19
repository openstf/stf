require('./device-control.css')

module.exports = angular.module('device-control', [
  require('stf/device').name,
  require('stf/control').name,
  require('stf/screen').name,
  require('ng-context-menu').name,
  require('stf/device-context-menu').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/device-control/device-control.jade',
      require('./device-control.jade')
    )
    $templateCache.put('control-panes/device-control/device-control-standalone.jade',
      require('./device-control-standalone.jade')
    )
  }])
  .controller('DeviceControlCtrl', require('./device-control-controller'))
  .directive('deviceControlKey', require('./device-control-key-directive'))
