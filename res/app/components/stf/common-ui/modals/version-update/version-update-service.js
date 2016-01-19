module.exports = function ServiceFactory($uibModal, $location) {
  var service = {}

  var ModalInstanceCtrl = function($scope, $uibModalInstance) {
    $scope.ok = function() {
      $uibModalInstance.close(true)
      $location.path('/')
    }

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel')
    }
  }

  service.open = function() {
    var modalInstance = $uibModal.open({
      template: require('./version-update.jade'),
      controller: ModalInstanceCtrl
    })

    modalInstance.result.then(function(/*selectedItem*/) {
    }, function() {
    })
  }

  return service
}
