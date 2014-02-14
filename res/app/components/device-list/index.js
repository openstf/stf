var angular = require('angular');

module.exports = angular.module('device-list', [])
  .constant('template', require('./device-list.jade'))
  .directive('demoComponent', require('./DemoDirective'))
  .controller('DeviceListCtrl', require('./DeviceListCtrl'));
