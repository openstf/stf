module.exports = function AdbKeysCtrl($scope, AddAdbKeyModalService) {

  //AddAdbKeyModalService.open({
  //  title: 'PC1264',
  //  fingerprint: 'bb:86:60:39:d7:a2:e3:09:93:09:cc:f6:e8:37:99:3f'
  //})

  $scope.adbKeys = [
    {
      title: 'A11251@PC1264.local',
      fingerprint: 'bb:86:60:39:d7:a2:e3:09:93:09:cc:f6:e8:37:99:3f'
    },
    {
      title: 'A11251@MobileMac.local',
      fingerprint: '97:ca:ae:fa:09:0b:c4:fe:22:94:7d:b2:be:77:66:a1'
    }
  ]

  $scope.removeKey = function (key) {
    console.log('Remove key', key)
    $scope.adbKeys.splice($scope.adbKeys.indexOf(key), 1)
  }

}
