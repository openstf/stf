module.exports = function DeviceControlCtrl(
  $scope
, $routeParams
, $location
, DeviceService
, GroupService
, ControlService
) {
  $scope.control = null
  $scope.device = null
  $scope.control = null
  $scope.installation = null

  $scope.install = function($files) {
    return $scope.control.install($files)
      .then(function(tx) {
        return tx.promise
          .progressed(function(result) {
            $scope.$apply(function() {
              $scope.installation = result
            })
          })
          .then(function(result) {
            $scope.$apply(function() {
              $scope.installation = result
            })
          })
      })
  }

  DeviceService.get($routeParams.serial, $scope)
    .then(function(device) {
      return GroupService.invite(device)
    })
    .then(function(device) {
      $scope.device = device
      $scope.control = ControlService.create(device, device.channel)
      return device
    })
    .catch(function() {
      $location.path('/')
    })
}
