module.exports = function RemoteDebugCtrl($scope) {
  $scope.vnc = {}

  $scope.generateVNCLogin = function() {
    $scope.vnc = {
      serverHost: 'localhost'
    , serverPort: '7042'
    , serverPassword: '12345678'
    }
  }
}
