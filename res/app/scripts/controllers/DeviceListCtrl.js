define(['./module', 'oboe'], function(mod, oboe) {
  mod.controller('DeviceListCtrl', ['$scope', function($scope) {
    $scope.devices = []

    oboe('/api/v1/devices')
      .node('$devices[*]', function(devicesLoadedSoFar) {
        $scope.$apply(function() {
          $scope.devices = devicesLoadedSoFar
        })
      })
  }])
})
