module.exports =
  function AdbKeysCtrl($scope, $http, UserService) {
    $scope.adbKeys = []

    function updateKeys() {
      $scope.adbKeys = UserService.getAdbKeys()
    }

    $scope.removeKey = function (key) {
      UserService.removeAdbKey(key)
    }

    $scope.$on('user.keys.adb.updated', updateKeys)
    updateKeys()

    //AddAdbKeyModalService.open({
    //  fingerprint: '9a:12:5b:14:e3:3e:c9:d3:59:be:4f:16:0d:4d:cd:26',
    //  title: 'a12907@PC-5954.local'
    //})

    //FatalMessageService.open({
    //  enhancedName: 'dev',
    //  enhancedStatePassive: 'online',
    //  likelyLeaveReason: 'Not good enough'
    //})


  }
