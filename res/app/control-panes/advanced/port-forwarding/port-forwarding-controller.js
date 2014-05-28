var _ = require('lodash')

module.exports = function PortForwardingCtrl($scope, ngTableParams) {

  $scope.portSets = [
    {
      targetHost: 'localhost',
      targetPort: 8080,
      devicePort: 8080
    }
  ]

  function portFieldsAreEmpty(ports) {
    return (_.isEmpty(ports.targetHost) && _.isEmpty(ports.targetPort) && _.isEmpty(ports.devicePort))
  }

  // Adds a new row whenever necessary
  $scope.$watch('portSets', function (newValue, oldValue) {
    // Remove all empty sets from the middle
    _.remove(newValue, function (ports, index) {
      // Skip last and remove empty fields
      return !!(newValue.length !== index + 1 && portFieldsAreEmpty(ports))
    })

    var last = _.last(newValue)
    if (!portFieldsAreEmpty(last)) {
      var empty = {
        //targetLocal: null,
        targetHost: null,
        targetPort: null,
        devicePort: null
      }
      $scope.portSets.push(empty)
    }
  }, true)

  $scope.portsTable = new ngTableParams({
    page: 1,
    count: 5
  }, {
    counts: [],
    total: 1,
    getData: function ($defer, params) {


      $defer.resolve($scope.portSets);
    }
  })
}
