module.exports =
  function SocketDisconnectedServiceFactory($modal, $location, $window) {
    var service = {}

    var ModalInstanceCtrl = function ($scope, $modalInstance, message) {
      $scope.ok = function () {
        $modalInstance.close(true)
        $window.location.reload()
      }

      $scope.message = message

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel')
      }

    }

    service.open = function (message) {
      var modalInstance = $modal.open({
        template: require('./socket-disconnected.jade'),
        controller: ModalInstanceCtrl,
        resolve: {
          message: function () {
            return message
          }
        }
      })

      modalInstance.result.then(function () {
      }, function () {
      })
    }

    return service
  }
