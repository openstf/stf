module.exports =
  function AddAdbKeyModalServiceFactory($modal) {
    var service = {}

    var ModalInstanceCtrl = function ($scope, $modalInstance, data) {
      $scope.modal = {}
      $scope.modal.showAdd = true
      $scope.modal.fingerprint = data.fingerprint
      $scope.modal.title = data.title

      $scope.ok = function () {
        $modalInstance.close(true)
      }

      $scope.$watch('modal.showAdd', function (newValue) {
        if (newValue === false) {
          $scope.ok()
        }
      })

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel')
      }
    }

    service.open = function (data) {
      var modalInstance = $modal.open({
        template: require('./add-adb-key-modal.jade'),
        controller: ModalInstanceCtrl,
        resolve: {
          data: function () {
            return data
          }
        }
      })

      return modalInstance.result
    }

    return service
  }
