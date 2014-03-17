module.exports = function DeviceControlCtrl($scope, $routeParams, $location, DeviceService, GroupService, ControlService) {
  $scope.control = null
  $scope.device = {
    promise: DeviceService.get($routeParams.serial, $scope)
      .then(function(device) {
        return GroupService.invite(device)
      })
      .then(function(device) {
        $scope.device.value = device
        $scope.control = ControlService.forOne(device, device.channel)
        return device
      })
      .catch(function(err) {
        $location.path('/')
      })
  }
}
