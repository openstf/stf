module.exports =
  function LargeErrorMessageServiceFactory($uibModal) {
    var LargeErrorMessageService = {}

    var ModalInstanceCtrl = function($scope, $uibModalInstance, message, headerTitle) {
      $scope.message = message
      $scope.headerTitle = headerTitle

      $scope.close = function() {
        $uibModalInstance.close(true)
      }
    }

    LargeErrorMessageService.open = function(message, headerTitle) {
      var modalInstance = $uibModal.open({
        template: require('./large-error-message.pug'),
        controller: ModalInstanceCtrl,
        resolve: {
          message: function() {
            return message
          },
          headerTitle: function() {
            return headerTitle
          }
        }
      })

      return modalInstance.result
    }

    return LargeErrorMessageService
  }
