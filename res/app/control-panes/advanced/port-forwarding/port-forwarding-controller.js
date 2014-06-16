var _ = require('lodash')

module.exports = function PortForwardingCtrl($scope, ngTableParams, SettingsService) {

  $scope.forwarding = false

//  SettingsService.bind($scope, {
//    key: 'forwarding',
//    storeName: 'PortForwarding.forwarding'
//  })

//  SettingsService.bind($scope, {
//    key: 'portSets',
//    storeName: 'PortForwarding.portSets'
//  })


  function getPortSets() {
    return $scope.portSets.slice(0, -1) // Last item is empty
  }

  function forwardPorts() {
    _.forEach(getPortSets(), function (portSet) {
      $scope.control.createForward(portSet).then(function (result) {
        console.log(result)
      }).catch(function (err) {
        console.error(err)
      })
    })
  }

  function unforwardPorts() {
    _.forEach(getPortSets(), function (portSet) {
      $scope.control.removeForward(portSet).then(function (result) {
        console.log(result)
      }).catch(function (err) {
        console.error(err)
      })
    })
  }

  $scope.$watch('forwarding', function (newValue, oldValue) {
    if (newValue !== oldValue) {
      if (newValue) {
        forwardPorts()
      } else {
        if (typeof oldValue !== 'undefined') {
          unforwardPorts()
        }
      }
    } else {
      // It's the first time, probably not forwarding
      $scope.forwarding = false
    }
  })


  function portFieldsAreEmpty(ports) {
    return (_.isEmpty(ports.targetHost) && _.isEmpty(ports.targetPort) && _.isEmpty(ports.devicePort))
  }

  $scope.portSets = [
    {
      targetHost: 'localhost',
      targetPort: 8080,
      devicePort: 8080
    }
  ]

//  SettingsService.getItem('PortForwarding.portSets').then(function (result) {
//    if (result) {
//      $scope.portSets = result
//    } else {
//      console.log('here')
//    }
//    console.log(result)
//  })

  function createEmptyField() {
    if (!$scope.portSets) {
      $scope.portSets = []
    }
    var empty = {
      targetHost: null,
      targetPort: null,
      devicePort: null
    }

    $scope.portSets.push(empty)
  }

  // Adds a new row whenever necessary
  $scope.$watch('portSets', function (newValue, oldValue) {
    if (newValue) {
      // Remove all empty sets from the middle
      _.remove(newValue, function (ports, index) {
        // Skip last and remove empty fields
        return !!(newValue.length !== index + 1 && portFieldsAreEmpty(ports))
      })

      var last = _.last(newValue)
      if (!portFieldsAreEmpty(last)) {
        createEmptyField()
      }
    } else {
     // createEmptyField()
    }

    //SettingsService.setItem('PortForwarding.portSets', angular.copy($scope.portSets))

  }, true)

  $scope.portsTable = new ngTableParams({
    page: 1,
    count: 5
  }, {
    counts: [],
    total: 1,
    getData: function ($defer, params) {


      $defer.resolve($scope.portSets)
    }
  })
}
