module.exports = function DeviceListCtrl($scope) {

  $scope.devices = [
    {serial: '1231231', present: true, owner: {email: 'fefe@f.com'}},
    {serial: '123122', present: true, owner: {email: 'fefe2@f.com'}}
  ];

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

};


//module.exports = function DeviceListCtrl($scope, deviceService, groupService) {
//
//  $scope.devices = deviceService.devices
//
//  $scope.invite = function (device) {
//    groupService.invite({
//      serial: {
//        value: device.serial, match: 'exact'
//      }
//    })
//  }
//
//  $scope.kick = function (device) {
//    groupService.kick({
//      serial: {
//        value: device.serial, match: 'exact'
//      }
//    })
//  }
//}
