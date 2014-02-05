define(['./_module'], function(controllers) {
  function DeviceControlCtrl($scope, $routeParams, deviceService) {
    $scope.device = null

    deviceService.get($routeParams.serial)
      .then(function(device) {
        $scope.device = device
      })
  }

  controllers.controller('DeviceControlCtrl'
  , [ '$scope'
    , '$routeParams'
    , 'DeviceService'
    , DeviceControlCtrl
    ])
})
