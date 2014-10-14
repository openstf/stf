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

  $scope.addRow = function () {
    $scope.reversePortForwards.push(defaultPortForwards)
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
