require('./standalone.css')

module.exports = angular.module('device-control.standalone', [
  require('stf/device').name,
  require('stf/control').name,
  require('stf/screen').name,
  require('stf/settings').name,
  require('stf/screen/scaling').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/device-control/standalone/standalone.jade',
      require('./standalone.jade')
    )
  }])
  .controller('StandaloneCtrl', require('./standalone-controller'))
  .factory('StandaloneService', require('./standalone-service'))
  .directive('standalone', require('./standalone-directive'))
