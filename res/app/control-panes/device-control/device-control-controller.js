var _ = require('lodash')

module.exports = function DeviceControlCtrl($scope, DeviceService, GroupService, $location, $timeout, gettext, $filter) {

  $scope.showScreen = true

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

  function isPortrait(value) {
    if (typeof value === 'undefined' && $scope.device) {
      value = $scope.device.display.rotation
    }
    return (value === 0 || value === 180)
  }

  function isLandscape(value) {
    if (typeof value === 'undefined' && $scope.device) {
      value = $scope.device.display.rotation
    }
    return (value === 90 || value === 270)
  }

  $scope.tryToRotate = function (rotation) {
    if (rotation === 'portrait') {
      $scope.control.rotate(0)
      $timeout(function () {
        if (isLandscape()) {
          $scope.currentRotation = 'landscape'
        }
      }, 400)
    } else if (rotation === 'landscape') {
      $scope.control.rotate(90)
      $timeout(function () {
        if (isPortrait()) {
          $scope.currentRotation = 'portrait'
        }
      }, 400)
    }
  }

  $scope.currentRotation = 'portrait'

  $scope.$watch('device.display.rotation', function (newValue, oldValue) {
    if (isPortrait(newValue)) {
      $scope.currentRotation = 'portrait'
    } else if (isLandscape(newValue)) {
      $scope.currentRotation = 'landscape'
    }
  })
}
