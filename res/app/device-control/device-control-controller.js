module.exports = function DeviceControlCtrl($scope, $routeParams, DeviceService, ControlService) {
  $scope.control = null
  $scope.device = {
    promise: DeviceService.get($routeParams.serial)
      .then(function(device) {
        $scope.device.value = device
        $scope.control = ControlService.forOne(device, device.channel)
        return device
      })
  }
}
