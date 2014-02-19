module.exports = function DeviceScreenCtrl($scope, ScalingService) {
  $scope.ready = false
  $scope.displayError = false
  $scope.ScalingService = ScalingService

  $scope.promiseOfDevice.then(function () {
    $scope.ready = true
  })
}
