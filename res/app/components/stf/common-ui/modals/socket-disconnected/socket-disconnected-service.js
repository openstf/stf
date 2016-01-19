module.exports =
  function SocketDisconnectedServiceFactory($uibModal, $location, $window) {
    var service = {}

    var ModalInstanceCtrl = function($scope, $uibModalInstance, message) {
      $scope.ok = function() {
        $uibModalInstance.close(true)
        $window.location.reload()
      }

      $scope.message = message

      $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel')
      }

    }

    service.open = function(message) {
      var modalInstance = $uibModal.open({
        template: require('./socket-disconnected.jade'),
        controller: ModalInstanceCtrl,
        resolve: {
          message: function() {
            return message
          }
        }
      })

      modalInstance.result.then(function() {
      }, function() {
      })
    }

    return service
  }
