require('./device-control.css')

module.exports = angular.module('device-control', [
  require('stf/device').name,
  require('stf/control').name,
  require('stf/screen').name
])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/control/:serial', {
      template: require('./device-control.jade'),
      controller: 'DeviceControlCtrl'
    })
  }])
  .controller('DeviceControlCtrl', require('./device-control-controller'))
