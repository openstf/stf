define(['./module', 'oboe'], function(mod, oboe) {
  function DeviceListCtrl($scope, deviceService) {
    $scope.devices = deviceService.devices
  }

  mod.controller('DeviceListCtrl'
  , [ '$scope'
    , 'deviceService'
    , DeviceListCtrl
    ])
})
