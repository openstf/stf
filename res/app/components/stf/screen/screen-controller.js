module.exports = function DeviceScreenCtrl($scope, ScalingService) {
  $scope.ready = false
  $scope.displayError = false
  $scope.canView = true
  $scope.showView = true
  $scope.ScalingService = ScalingService

  $scope.promiseOfDevice.then(function () {
    $scope.ready = true
  })
}
