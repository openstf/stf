define(['./module'], function(mod) {
  function DeviceControlCtrl($scope, $routeParams, deviceService) {
    $scope.device = null

    deviceService.get($routeParams.serial)
      .then(function(device) {
        $scope.device = device
      })
  }

  mod.controller('DeviceControlCtrl'
  , [ '$scope'
    , '$routeParams'
    , 'deviceService'
    , DeviceControlCtrl
    ])
})
