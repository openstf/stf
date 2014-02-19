module.exports = function DeviceControlCtrl($scope, $routeParams, DeviceService, ControlService) {
  $scope.device = null
  $scope.control = null

  $scope.promiseOfDevice = DeviceService.get($routeParams.serial)
    .then(function (device) {
      $scope.device = device
      $scope.control = ControlService.forChannel(device.channel)
      return device
    })
}