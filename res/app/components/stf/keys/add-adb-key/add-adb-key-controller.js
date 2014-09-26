module.exports = function AdbKeysCtrl($scope, AdbKeysService) {
  $scope.title = ''
  $scope.key = ''

  //$scope.$watch('showClipboard', function (e) {
  //  console.log('hi',e)
  //  $scope.showClipboard = true
  //})

  $scope.addKey = function () {
    if ($scope.title && $scope.key) {

      var title = $scope.title
      var fingerprint = '97:ca:ae:fa:09:0b:c4:fe:22:94:7d:b2:be:77:66:a1'

      console.log('Adding key')
      //$scope.adbKeys.push({
      //  title: title,
      //  fingerprint: fingerprint
      //})

      $scope.closeAddKey()
    }
  }

  $scope.closeAddKey = function () {
    $scope.title = ''
    $scope.key = ''
    $scope.adbkeyform.$setPristine()
    $scope.showAdd = false
  }

  $scope.changed = function () {
    //console.log('changedx', $scope.key)
  }

  $scope.$watch('key', function (newValue) {
    //console.log('newValue', newValue)

    if (newValue && !$scope.title) {
      $scope.title = AdbKeysService.hostNameFromKey(newValue)
    }
  })
}
