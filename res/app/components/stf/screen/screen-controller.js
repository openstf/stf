module.exports = function DeviceScreenCtrl($scope, $rootScope, ScalingService) {
  $scope.displayError = false
  $scope.canView = true
  $scope.showScreen = true
  $scope.ScalingService = ScalingService

  var deregisterPageHidden = $rootScope.$on('pageHidden', function () {
    $scope.canView = false
  })

  var deregisterPageVisible = $rootScope.$on('pageVisible', function () {
    $scope.canView = true
  })

  $scope.$on('$destroy', function() {
    deregisterPageHidden()
    deregisterPageVisible()
  })
}
