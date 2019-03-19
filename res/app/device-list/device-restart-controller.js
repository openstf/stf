var _ = require('lodash')

module.exports = function DeviceRestartController(
  $scope, $http, gettext, $routeParams,
  $timeout, $location, DeviceService, GroupService, ControlService,
  SettingsService
) {
  $scope.device = null
  $scope.control = null
  DeviceService.get($routeParams.serial, $scope)
    .then(function(device) {
      $scope.device = device
      $scope.control = ControlService.create(device, device.channel)
      SettingsService.set('lastUsedDevice', $routeParams.serial)
      $scope.control.workerRestart()
      $location.path('/')
    })
  return {}
}
