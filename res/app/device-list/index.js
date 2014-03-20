require('./device-list.css')

require('script!ng-table/ng-table')
require('ng-table/ng-table.css')

module.exports = angular.module('device-list', [
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/common-ui').name,
  'ngTable'
])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/devices', {
      template: require('./device-list.jade'),
      controller: 'DeviceListCtrl'
    })
  }])
  .controller('DeviceListCtrl', require('./device-list-controller'))