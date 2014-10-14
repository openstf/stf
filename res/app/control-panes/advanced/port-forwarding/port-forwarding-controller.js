module.exports = function PortForwardingCtrl(
  $scope
, SettingsService
) {
  $scope.reversePortForwards = [
    {
      targetHost: 'localhost'
    , targetPort: 8080
    , devicePort: 8080
    , enabled: false
    }
  ]

  SettingsService.bind($scope, {
    target: 'reversePortForwards'
  , source: 'reversePortForwards'
  })

  $scope.enableForward = function(forward) {
    forward.processing = true
    return $scope.control.createForward(forward)
      .finally(function() {
        forward.processing = false
      })
  }

  $scope.disableForward = function(forward) {
    forward.processing = true
    return $scope.control.removeForward(forward)
      .finally(function() {
        forward.processing = false
      })
  }
}
