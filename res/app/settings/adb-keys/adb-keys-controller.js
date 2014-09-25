module.exports = function AdbKeysCtrl($scope, BrowserInfo) {

  $scope.adbKeys = [
    {
      title: 'PC1264',
      key: 'bb:86:60:39:d7:a2:e3:09:93:09:cc:f6:e8:37:99:3f'
    },
    {
      title: 'Mobile mac',
      key: '97:ca:ae:fa:09:0b:c4:fe:22:94:7d:b2:be:77:66:a1'
    }
  ]

  $scope.removeKey = function (key) {
    console.log('Remove key', key)
    $scope.adbKeys.splice($scope.adbKeys.indexOf(key), 1)
  }

  $scope.addKey = function () {
    if ($scope.title && $scope.key) {

      $scope.adbKeys.push({
        title: $scope.title,
        key: $scope.key
      })

      $scope.closeAddKey()
    }
  }

  var clientOS = 'PC'
  if (BrowserInfo.ua.match(/Mac/i)) {
    clientOS = 'Mac'
  }

  var addKeyDefaults = {
    title: 'My ' + clientOS,
    key: ''
  }

  $scope.title = addKeyDefaults.title
  $scope.key = addKeyDefaults.key

  $scope.closeAddKey = function () {
    $scope.title = addKeyDefaults.title
    $scope.key = addKeyDefaults.key
    $scope.adbkeyform.$setPristine()
    $scope.showAdd = false
  }

  $scope.toggleAddKey = function () {
    $scope.showAdd = !$scope.showAdd
    $scope.focusAddTitle = true
  }


}
