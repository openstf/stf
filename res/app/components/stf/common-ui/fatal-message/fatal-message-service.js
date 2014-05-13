module.exports = function FatalMessageServiceFactory($modal, $location, $route) {
  var FatalMessageService = {}


  var ModalInstanceCtrl = function ($scope, $modalInstance, device) {
    $scope.ok = function () {
      $modalInstance.close(5)
      $route.reload()
      //$location.path('/control/' + device.serial)
    }

    $scope.second = function () {
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
        device: device,
        items: function () {
          return 10
        }
      }
    })

    modalInstance.result.then(function (selectedItem) {
      console.log(selectedItem)
    }, function () {
      console.log('Modal dismissed at: ' + new Date())
    })
  }

  return FatalMessageService
}
