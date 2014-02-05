define(['./_module'], function(controllers) {
  function DeviceListCtrl($scope, deviceService, groupService) {
    $scope.devices = deviceService.devices

    $scope.invite = function(device) {
      groupService.invite({
        serial: {
          value: device.serial
        , match: 'exact'
        }
      })
    }

    $scope.kick = function(device) {
      groupService.kick({
        serial: {
          value: device.serial
        , match: 'exact'
        }
      })
    }
  }

  controllers.controller('DeviceListCtrl'
  , [ '$scope'
    , 'DeviceService'
    , 'GroupService'
    , DeviceListCtrl
    ])
})
