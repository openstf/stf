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
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('device-list/details/battery-level.jade', require('./details/battery-level.jade'))
    $templateCache.put('device-list/details/model.jade', require('./details/model.jade'))
    $templateCache.put('device-list/details/status.jade', require('./details/status.jade'))
    $templateCache.put('device-list/details/user.jade', require('./details/user.jade'))
  }])
  .controller('DeviceListCtrl', require('./device-list-controller'))
  .controller(
    'DeviceListDetailsCtrl'
  , require('./device-list-details-controller')
  )
  .directive('deviceListDetails', require('./device-list-details-directive'))
