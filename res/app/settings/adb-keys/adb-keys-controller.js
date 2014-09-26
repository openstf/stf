module.exports = function AdbKeysCtrl($scope, AdbKeysService) {

  $scope.title = ''
  $scope.key = ''

  $scope.adbKeys = [
    {
      title: 'PC1264',
      fingerprint: 'bb:86:60:39:d7:a2:e3:09:93:09:cc:f6:e8:37:99:3f'
    },
    {
      title: 'Mobile mac',
      fingerprint: '97:ca:ae:fa:09:0b:c4:fe:22:94:7d:b2:be:77:66:a1'
    }
  ]

  $scope.removeKey = function (key) {
    console.log('Remove key', key)
    $scope.adbKeys.splice($scope.adbKeys.indexOf(key), 1)
  }

  $scope.addKey = function () {
    if ($scope.title && $scope.key) {

      var title = $scope.title
      var fingerprint = '97:ca:ae:fa:09:0b:c4:fe:22:94:7d:b2:be:77:66:a1'

      $scope.adbKeys.push({
        title: title,
        fingerprint: fingerprint
      })

      $scope.closeAddKey()
    }
  }


  $scope.closeAddKey = function () {
    $scope.title = ''
    $scope.key = ''
    $scope.adbkeyform.$setPristine()
    $scope.showAdd = false
  }

  $scope.toggleAddKey = function () {
    $scope.showAdd = !$scope.showAdd
  }

  $scope.$watch('key', function (newValue) {
    if (newValue && !$scope.title) {
      $scope.title = AdbKeysService.hostNameFromKey(newValue)
    }
  })

}
