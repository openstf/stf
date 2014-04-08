var _ = require('lodash')

module.exports = function DeviceControlCtrl($scope, $rootScope, DeviceService, GroupService, $location) {

  $scope.groupTracker = DeviceService.trackGroup($scope)

  $scope.groupDevices = $scope.groupTracker.devices

  $scope.kickDevice = function (device) {

    // If we're trying to kick current device
    if (device.serial === $rootScope.device.serial) {

      // If there is more than one device left
      if ($scope.groupDevices.length > 1) {

        // Control first free device first
        var firstFreeDevice = _.find($scope.groupDevices, function (dev) {
          return dev.serial !== $rootScope.device.serial
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
//  $scope
//, $routeParams
//, $location
//, DeviceService
//, GroupService
//, ControlService
//) {
//  $scope.device = null
//  $scope.control = null
//  $scope.installation = null
//
//  $scope.install = function($files) {
//    return $scope.control.install($files)
//      .then(function(tx) {
//        return tx.promise
//          .progressed(function(result) {
//            $scope.$apply(function() {
//              $scope.installation = result
//            })
//          })
//          .then(function(result) {
//            $scope.$apply(function() {
//              $scope.installation = result
//            })
//          })
//      })
//  }
//
//  DeviceService.get($routeParams.serial, $scope)
//    .then(function(device) {
//      return GroupService.invite(device)
//    })
//    .then(function(device) {
//      $scope.device = device
//      $scope.control = ControlService.create(device, device.channel)
//      return device
//    })
//    .catch(function() {
//      $location.path('/')
//    })
//}
