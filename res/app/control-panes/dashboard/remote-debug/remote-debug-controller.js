module.exports = function RemoteDebugCtrl($scope, $timeout) {
  function startRemoteConnect() {
    $scope.control.startRemoteConnect().then(function (result) {
      var url = result.lastData
      $scope.$apply(function () {
        $scope.debugCommand = 'adb connect ' + url
      })
    })
  }

  // TODO: Remove timeout and fix control initialization
  if ($scope.control) {
    startRemoteConnect()
  } else {
    $timeout(startRemoteConnect, 200)
  }
}
