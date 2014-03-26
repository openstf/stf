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
          .progressed(function(results) {
            $scope.$apply(function() {
              $scope.installation = results[0]
            })
          })
          .then(function(results) {
            $scope.$apply(function() {
              $scope.installation = results[0]
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
      $scope.control = ControlService.forOne(device, device.channel)
      return device
    })
    .catch(function() {
      $location.path('/')
    })
}
