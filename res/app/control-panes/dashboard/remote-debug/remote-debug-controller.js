module.exports = function RemoteDebugCtrl($scope, $timeout, gettext) {
  function startRemoteConnect() {
    if ($scope.control) {
      $scope.control.startRemoteConnect().then(function(result) {
        var url = result.lastData
        $scope.$apply(function() {
          $scope.debugCommand = 'adb connect ' + url
        })
      })

      return true
    }
    return false
  }

  // TODO: Remove timeout and fix control initialization
  if (!startRemoteConnect()) {
    $timeout(function() {
      if (!startRemoteConnect()) {
        $timeout(startRemoteConnect, 1000)
      }
    }, 200)
  }

  $scope.$watch('platform', function(newValue) {
    if (newValue === 'native') {
      $scope.remoteDebugTooltip =
        gettext('Run the following on your command line to debug the device from your IDE')
    } else {
      $scope.remoteDebugTooltip =
        gettext('Run the following on your command line to debug the device from your Browser')
    }

  })

}
