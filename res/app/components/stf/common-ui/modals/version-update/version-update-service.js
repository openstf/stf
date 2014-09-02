module.exports = function ServiceFactory($modal, $location) {
  var service = {}

  var ModalInstanceCtrl = function ($scope, $modalInstance) {
    $scope.ok = function () {
      $modalInstance.close(true)
      $location.path('/')
    }

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel')
    }
  }

  service.open = function () {
    var modalInstance = $modal.open({
      template: require('./version-update.jade'),
      controller: ModalInstanceCtrl
    })

    modalInstance.result.then(function (/*selectedItem*/) {
    }, function () {
    })
  }

  return service
}
