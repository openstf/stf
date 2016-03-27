module.exports =
  function AdbKeysCtrl($scope, $http, UserService) {
    $scope.adbKeys = []

    function updateKeys() {
      $scope.adbKeys = UserService.getAdbKeys()
    }

    $scope.removeKey = function(key) {
      UserService.removeAdbKey(key)
    }

    $scope.$on('user.keys.adb.updated', updateKeys)
    updateKeys()
  }
