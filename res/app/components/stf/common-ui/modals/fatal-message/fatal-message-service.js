module.exports = function FatalMessageServiceFactory($modal, $location, $route, $interval) {
  var FatalMessageService = {}

  var intervalDeviceInfo

  var ModalInstanceCtrl = function ($scope, $modalInstance, device, tryToReconnect) {
    $scope.ok = function () {
      $modalInstance.close(true)
      $route.reload()
      //$location.path('/control/' + device.serial)
    }

    if (tryToReconnect) {
      // TODO: this is ugly, find why its not updated correctly (also on the device list)
      intervalDeviceInfo = $interval(function () {
        $scope.device = device

        if (device.usable) {
          // Try to reconnect
          $scope.ok()
        }
      }, 1000, 500)
    }

    $scope.device = device

    $scope.second = function () {
      $modalInstance.dismiss()
      $location.path('/devices/')
    }

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel')
    }

    var destroyInterval = function () {
      if (angular.isDefined(intervalDeviceInfo)) {
        $interval.cancel(intervalDeviceInfo)
        intervalDeviceInfo = undefined
      }
    }

    $scope.$on('$destroy', function () {
      destroyInterval()
    })
  }

  FatalMessageService.open = function (device, tryToReconnect) {
    var modalInstance = $modal.open({
      template: require('./fatal-message.jade'),
      controller: ModalInstanceCtrl,
      resolve: {
        device: function () {
          return device
        },
        tryToReconnect: function () {
          return tryToReconnect
        }
      }
    })

    modalInstance.result.then(function () {
    }, function () {

    })
  }


  return FatalMessageService
}
