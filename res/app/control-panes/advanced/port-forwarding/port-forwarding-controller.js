var _ = require('lodash')

module.exports = function PortForwardingCtrl($scope
  , SettingsService) {

  var defaultPortForwards = {
    targetHost: 'localhost'
    , targetPort: 8080
    , devicePort: 8080
    , enabled: false
  }

  $scope.reversePortForwards = [
    defaultPortForwards
  ]

  // TODO: tracking by devicePort needs a bit of care
  SettingsService.bind($scope, {
    target: 'reversePortForwards'
    , source: 'reversePortForwards'
  })

  $scope.enableForward = function (forward) {
    forward.processing = true
    return $scope.control.createForward(forward)
      .finally(function () {
        forward.processing = false
      })
  }

  $scope.disableForward = function (forward) {
    forward.processing = true
    return $scope.control.removeForward(forward)
      .finally(function () {
        forward.processing = false
      })
  }

  function ensureUniqueDevicePorts() {
    $scope.reversePortForwards =
      _.uniq($scope.reversePortForwards, 'devicePort')
  }

  $scope.addRow = function () {
    // TODO: tracking by devicePort needs a bit of care
    $scope.reversePortForwards.push(defaultPortForwards)
    ensureUniqueDevicePorts()
  }

  $scope.removeRow = function (forward) {
    $scope.disableForward(forward)
    $scope.reversePortForwards.splice(
      $scope.reversePortForwards.indexOf(forward), 1)
  }

  $scope.showApply = function () {
    $scope.isShowApply = true
  }

  $scope.applyTable = function () {
    console.log('TODO: Sync back the changes')
    $scope.isShowApply = false
  }
}
