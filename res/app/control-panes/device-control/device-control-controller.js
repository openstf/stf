module.exports = function DeviceControlCtrl($scope, DeviceService, GroupService, $location) {

  $scope.groupTracker = DeviceService.trackGroup($scope)

  $scope.groupDevices = $scope.groupTracker.devices

  $scope.kickDevice = function (device) {
    // if current device
    // no more: go to devices
    // more: go to first

    return GroupService.kick(device).then(function () {
      $scope.$digest()
    })
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
