var _ = require('lodash')

module.exports = function DeviceControlCtrl($scope, DeviceService, GroupService, $location) {

  $scope.groupTracker = DeviceService.trackGroup($scope)

  $scope.groupDevices = $scope.groupTracker.devices

  $scope.kickDevice = function (device) {

    // If we're trying to kick current device
    if (device.serial === $scope.device.serial) {

      // If there is more than one device left
      if ($scope.groupDevices.length > 1) {

        // Control first free device first
        var firstFreeDevice = _.find($scope.groupDevices, function (dev) {
          return dev.serial !== $scope.device.serial
        })
        $scope.controlDevice(firstFreeDevice)

        // Then kick the old device
        GroupService.kick(device).then(function () {
          $scope.$digest()
        })
      } else {
        // Kick the device
        GroupService.kick(device).then(function () {
          $scope.$digest()
        })
        $location.path('/devices/')
      }
    } else {
      GroupService.kick(device).then(function () {
        $scope.$digest()
      })
    }
  }

  $scope.controlDevice = function (device) {
    $location.path('/control/' + device.serial)
  }
}
