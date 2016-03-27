module.exports = function DeviceScreenCtrl(
  $scope
, $rootScope
, ScalingService
, InstallService
) {
  $scope.displayError = false
  $scope.ScalingService = ScalingService

  $scope.installFile = function($files) {
    return InstallService.installFile($scope.control, $files)
  }
}
