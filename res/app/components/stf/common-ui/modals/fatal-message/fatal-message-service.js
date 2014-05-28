module.exports = function FatalMessageServiceFactory($modal, $location, $route) {
  var FatalMessageService = {}


  var ModalInstanceCtrl = function ($scope, $modalInstance, device) {
    $scope.ok = function () {
      $modalInstance.close(true)
      $route.reload()
      //$location.path('/control/' + device.serial)
    }

    $scope.second = function () {
      $modalInstance.dismiss()
      $location.path('/devices/')
    }

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel')
    }
  }

  FatalMessageService.open = function (device) {
    var modalInstance = $modal.open({
      template: require('./fatal-message.jade'),
      controller: ModalInstanceCtrl,
      resolve: {
        device: device
      }
    })

    modalInstance.result.then(function (selectedItem) {
    }, function () {

    })
  }


  return FatalMessageService
}
