module.exports = function ServiceFactory($uibModal, $sce) {
  var service = {}

  var ModalInstanceCtrl = function($scope, $uibModalInstance, url, title, icon) {
    $scope.ok = function() {
      $uibModalInstance.close(true)
    }

    $scope.url = $sce.trustAsResourceUrl(url)
    $scope.title = title
    $scope.icon = icon

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel')
    }
  }

  service.open = function(url, title, icon) {
    var modalInstance = $uibModal.open({
      template: require('./external-url-modal.jade'),
      controller: ModalInstanceCtrl,
      windowClass: 'modal-size-80p',
      resolve: {
        title: function() {
          return title
        },
        url: function() {
          return url
        },
        icon: function() {
          return icon
        }
      }
    })

    modalInstance.result.then(function() {
    }, function() {
    })
  }

  return service
}
