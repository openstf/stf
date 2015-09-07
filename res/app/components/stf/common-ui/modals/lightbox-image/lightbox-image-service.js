module.exports = function ServiceFactory($modal) {
  var service = {}

  var ModalInstanceCtrl = function ($scope, $modalInstance, title, imageUrl) {
    $scope.ok = function () {
      $modalInstance.close(true)
    }

    $scope.title = title
    $scope.imageUrl = imageUrl

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel')
    }
  }

  service.open = function (title, imageUrl) {
    var modalInstance = $modal.open({
      template: require('./lightbox-image.jade'),
      controller: ModalInstanceCtrl,
      windowClass: 'modal-size-xl',
      resolve: {
        title: function() {
          return title
        },
        imageUrl: function () {
          return imageUrl
        }
      }
    })

    modalInstance.result.then(function () {
    }, function () {
    })
  }

  return service
}
