module.exports = angular.module('control-panes', [
  require('stf/common-ui/nice-tabs').name,
  require('stf/device').name,
  require('stf/control').name,
  require('stf/scoped-hotkeys').name,
  require('./device-control').name,
  require('./advanced').name,
  require('./automation').name,
  require('./performance').name,
  require('./dashboard').name,
  //require('./inspect').name,
  //require('./activity').name,
  require('./logs').name,
  //require('./resources').name,
  require('./screenshots').name,
  require('./explorer').name,
  require('./info').name
])
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider
      .when('/control', {
        template: '<div ng-controller="ControlPanesNoDeviceController"></div>',
        controller: 'ControlPanesNoDeviceController'
      })
      .when('/control/:serial', {
        template: require('./control-panes.jade'),
        controller: 'ControlPanesCtrl'
        // TODO: Move device inviting to resolve
        //resolve: {
        //  device
        //  control
        //}
      })
      // TODO: add standalone
      .when('/c/:serial', {
        template: require('./control-panes.jade'),
        controller: 'ControlPanesCtrl'
      })
  }])
  .factory('ControlPanesService', require('./control-panes-service'))
  .controller('ControlPanesCtrl', require('./control-panes-controller'))
  .controller('ControlPanesNoDeviceController',
  require('./control-panes-no-device-controller'))
  .controller('ControlPanesHotKeysCtrl',
  require('./control-panes-hotkeys-controller'))
