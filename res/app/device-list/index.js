require('./device-list.css')

module.exports = angular.module('device-list', [
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/control').name,
  require('stf/common-ui').name,
  require('stf/settings').name,
  require('./column').name,
  require('./details').name,
  require('./empty').name,
  require('./icons').name,
  require('./stats').name,
  require('./customize').name,
  require('./search').name
])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/devices', {
        template: require('./device-list.jade'),
        controller: 'DeviceListCtrl'
      })
  }])
  .controller('DeviceListCtrl', require('./device-list-controller'))
