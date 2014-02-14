module.exports = function DeviceListCtrl($scope, deviceService, groupService) {

  $scope.devices = deviceService.devices

  $scope.invite = function (device) {
    groupService.invite({
      serial: {
        value: device.serial, match: 'exact'
      }
    })
  }

  $scope.kick = function (device) {
    groupService.kick({
      serial: {
        value: device.serial, match: 'exact'
      }
    })
  }
}
