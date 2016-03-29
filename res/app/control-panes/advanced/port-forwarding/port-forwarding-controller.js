var uuid = require('node-uuid')
var Promise = require('bluebird')

module.exports = function PortForwardingCtrl(
  $scope
, SettingsService
) {
  function defaults(id) {
    return {
      id: id
    , targetHost: 'localhost'
    , targetPort: 8080
    , devicePort: 8080
    , enabled: false
    }
  }

  $scope.reversePortForwards = [defaults('_default')]

  SettingsService.bind($scope, {
    target: 'reversePortForwards'
  , source: 'reversePortForwards'
  })

  $scope.$watch('device.reverseForwards', function(newValue) {
    var map = Object.create(null)

    if (newValue) {
      newValue.forEach(function(forward) {
        map[forward.id] = forward
      })
    }

    $scope.reversePortForwards.forEach(function(forward) {
      var deviceForward = map[forward.id]
      forward.enabled = !!(deviceForward && deviceForward.id === forward.id &&
        deviceForward.devicePort === forward.devicePort)
    })
  })

  $scope.applyForward = function(forward) {
    return forward.enabled ?
      $scope.control.createForward(forward) :
      $scope.control.removeForward(forward)
  }

  $scope.enableForward = function(forward) {
    if (forward.enabled) {
      return Promise.resolve()
    }

    return $scope.control.createForward(forward)
  }

  $scope.disableForward = function(forward) {
    if (!forward.enabled) {
      return Promise.resolve()
    }

    return $scope.control.removeForward(forward)
  }

  $scope.addRow = function() {
    $scope.reversePortForwards.push(defaults(uuid.v4()))
  }

  $scope.removeRow = function(forward) {
    $scope.disableForward(forward)
    $scope.reversePortForwards.splice(
      $scope.reversePortForwards.indexOf(forward), 1)
  }
}
