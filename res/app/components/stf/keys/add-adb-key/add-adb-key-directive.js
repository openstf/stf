module.exports = function addAdbKeyDirective(AdbKeysService) {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      showAdd: '=',
      showClipboard: '='
    },
    template: require('./add-adb-key.pug'),
    controller: function($scope, UserService) {
      $scope.addForm = {
        title: ''
      , key: ''
      }

      $scope.$on('user.keys.adb.error', function(event, error) {
        $scope.$apply(function() {
          $scope.error = error.message
        })
      })

      $scope.$on('user.keys.adb.updated', function() {
        $scope.closeAddKey()
      })

      $scope.addKey = function() {
        UserService.addAdbKey({
          title: $scope.addForm.title
        , key: $scope.addForm.key
        })
      }

      $scope.closeAddKey = function() {
        $scope.addForm.title = ''
        $scope.addForm.key = ''
        // TODO: cannot access to the form by name inside a directive?
        //$scope.adbkeyform.$setPristine()
        $scope.showAdd = false
        $scope.error = ''
      }
    },
    link: function(scope) {
      scope.$watch('addForm.key', function(newValue) {
        if (newValue && !scope.addForm.title) {
          // By default sets the title to the ADB key comment because
          // usually it happens to be username@hostname.
          scope.addForm.title = AdbKeysService.commentFromKey(newValue)
        }
      })
    }
  }
}
