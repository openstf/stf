module.exports = function RemoteDebugCtrl($scope) {

  $scope.remoteDebugCommand = function () {
    var server = '127.0.0.1:5555'
    return 'adb connect ' + server
  }
}
