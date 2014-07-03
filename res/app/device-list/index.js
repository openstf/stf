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
  .service('DeviceColumnService', require('./device-column-service'))
  .directive('deviceListDetails', require('./device-list-details-directive'))
  .directive('deviceListIcons', require('./device-list-icons-directive'))
  .directive('deviceListStats', require('./device-list-stats-directive'))
  .directive('deviceListEmpty', require('./device-list-empty-directive'))
