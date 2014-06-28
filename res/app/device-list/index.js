require('./device-list.css')

require('checklist-model')

module.exports = angular.module('device-list', [
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/common-ui').name,
  'checklist-model'
])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/devices', {
        template: require('./device-list.jade'),
        controller: 'DeviceListCtrl'
      })
  }])
  .controller('DeviceListCtrl', require('./device-list-controller'))
  .controller(
    'DeviceListDetailsCtrl'
  , require('./device-list-details-controller')
  )
  .directive('deviceListDetails', require('./device-list-details-directive'))
