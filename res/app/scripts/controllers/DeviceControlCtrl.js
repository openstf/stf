define(['./_module'], function(app) {
  function DeviceControlCtrl($scope, $routeParams, deviceService, controlService) {
    $scope.device = null
    $scope.control = null

    $scope.promiseOfDevice = deviceService.get($routeParams.serial)
      .then(function(device) {
        $scope.device = device
        $scope.control = controlService.forChannel(device.channel)
        return device
      })
  }

  app.controller('DeviceControlCtrl'
  , [ '$scope'
    , '$routeParams'
    , 'DeviceService'
    , 'ControlService'
    , DeviceControlCtrl
    ])
})
