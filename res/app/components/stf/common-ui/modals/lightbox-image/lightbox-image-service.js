module.exports = function ServiceFactory($uibModal) {
  var service = {}

  var ModalInstanceCtrl = function($scope, $uibModalInstance, title, imageUrl) {
    $scope.ok = function() {
      $uibModalInstance.close(true)
    }

    $scope.title = title
    $scope.imageUrl = imageUrl

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel')
    }
  }

  service.open = function(title, imageUrl) {
    var modalInstance = $uibModal.open({
      template: require('./lightbox-image.jade'),
      controller: ModalInstanceCtrl,
      windowClass: 'modal-size-xl',
      resolve: {
        title: function() {
          return title
        },
        imageUrl: function() {
          return imageUrl
        }
      }
    })

    modalInstance.result.then(function() {
    }, function() {
    })
  }

  return service
}
