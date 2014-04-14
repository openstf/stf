module.exports = function PortForwardingCtrl($scope, ngTableParams) {

  $scope.portSets = [
    {
      targetHost: '',
      targetPort: '',
      devicePort: ''
    }
  ]

  $scope.portsTable = new ngTableParams({
  }, {
    counts: [],
    total: 1,
    getData: function ($defer, params) {
      var data = $scope.portSets

      $defer.resolve(data);
    }
  })
}
