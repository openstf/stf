module.exports = function DeviceControlCtrl(
  $scope
, $routeParams
, $location
, DeviceService
, GroupService
, ControlService
) {
  $scope.control = null
  $scope.device = null
  $scope.control = null

  DeviceService.get($routeParams.serial, $scope)
    .then(function(device) {
      return GroupService.invite(device)
    })
    .then(function(device) {
      $scope.device = device
      $scope.control = ControlService.forOne(device, device.channel)
      return device
    })
    .catch(function() {
      $location.path('/')
    })
}
