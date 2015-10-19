module.exports = function ServiceFactory($modal, $sce) {
  var service = {}

  var ModalInstanceCtrl = function ($scope, $modalInstance, url, title, icon) {
    $scope.ok = function () {
      $modalInstance.close(true)
    }

    $scope.url = $sce.trustAsResourceUrl(url)
    $scope.title = title
    $scope.icon = icon

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel')
    }
  }

  service.open = function (url, title, icon) {
    var modalInstance = $modal.open({
      template: require('./external-url-modal.jade'),
      controller: ModalInstanceCtrl,
      windowClass: 'modal-size-80p',
      resolve: {
        title: function() {
          return title
        },
        url: function () {
          return url
        },
        icon: function () {
          return icon
        }
      }
    })

    modalInstance.result.then(function () {
    }, function () {
    })
  }

  return service
}
