module.exports =
  function AddAdbKeyModalServiceFactory($uibModal) {
    var service = {}

    var ModalInstanceCtrl = function($scope, $uibModalInstance, data) {
      $scope.modal = {}
      $scope.modal.showAdd = true
      $scope.modal.fingerprint = data.fingerprint
      $scope.modal.title = data.title

      $scope.ok = function() {
        $uibModalInstance.close(true)
      }

      $scope.$watch('modal.showAdd', function(newValue) {
        if (newValue === false) {
          $scope.ok()
        }
      })

      $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel')
      }
    }

    service.open = function(data) {
      var modalInstance = $uibModal.open({
        template: require('./add-adb-key-modal.jade'),
        controller: ModalInstanceCtrl,
        resolve: {
          data: function() {
            return data
          }
        }
      })

      return modalInstance.result
    }

    return service
  }
