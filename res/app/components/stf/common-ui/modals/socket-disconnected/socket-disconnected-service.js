module.exports =
  function SocketDisconnectedServiceFactory($modal, $location, $route) {
    var service = {}


    var ModalInstanceCtrl = function ($scope, $modalInstance) {
      $scope.ok = function () {
        $modalInstance.close(true)
        $route.reload()
        //$location.path('/control/' + device.serial)
      }


      $scope.second = function () {
        $modalInstance.dismiss()
        //$location.path('/devices/')
      }

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel')
      }

    }

    service.open = function () {
      var modalInstance = $modal.open({
        template: require('./socket-disconnected.jade'),
        controller: ModalInstanceCtrl,
        resolve: {}
      })

      modalInstance.result.then(function () {
      }, function () {

      })
    }


    return service
  }
