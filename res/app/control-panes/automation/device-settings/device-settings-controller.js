module.exports = function DeviceSettingsCtrl($scope, $timeout) {
  $scope.wifiEnabled = true

  function getWifiStatus() {
    if ($scope.control) {
      $scope.control.getWifiStatus().then(function(result) {
        $scope.$apply(function() {
          $scope.wifiEnabled = (result.lastData === 'wifi_enabled')
        })
      })
    }
  }
  getWifiStatus()

  $scope.toggleWifi = function(enable) {
    if ($scope.control) {
      $scope.control.setWifiEnabled(enable)
      $timeout(getWifiStatus, 2500)
    }
  }

  $scope.$watch('ringerMode', function(newValue, oldValue) {
    if (oldValue) {
      if ($scope.control) {
        $scope.control.setRingerMode(newValue)
      }
    }
  })

  function getRingerMode() {
    if ($scope.control) {
      $scope.control.getRingerMode().then(function(result) {
        $scope.$apply(function() {
          $scope.ringerMode = result.body
        })
      })
    }
  }
  getRingerMode()

}
