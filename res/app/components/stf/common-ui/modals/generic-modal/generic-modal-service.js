/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports =
  function GenericModalServiceFactory($uibModal) {
    const service = {}

    const ModalInstanceCtrl = function($scope, $uibModalInstance, data) {
      $scope.data = data

      $scope.ok = function() {
        $uibModalInstance.close(true)
      }

      $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel')
      }
    }

    service.open = function(data) {
      var modalInstance = $uibModal.open({
        template: require('./generic-modal.pug'),
        controller: ModalInstanceCtrl,
        size: data.size,
        animation: true,
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
