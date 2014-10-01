module.exports = function AdbKeysCtrl($scope, $http, UserService, AddAdbKeyModalService) {

  //AddAdbKeyModalService.open({
  //  title: 'PC1264',
  //  fingerprint: 'bb:86:60:39:d7:a2:e3:09:93:09:cc:f6:e8:37:99:3f'
  //})

  $scope.adbKeys = []

  function updateKeys() {
    $scope.adbKeys = UserService.getAdbKeys()
  }

  $scope.removeKey = function (key) {
    UserService.removeAdbKey(key).then(updateKeys)
  }

  updateKeys()
}
