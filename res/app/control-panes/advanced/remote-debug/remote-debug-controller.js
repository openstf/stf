module.exports = function RemoteDebugCtrl($scope) {

  $scope.control.startRemoteConnect().then(function (result) {
    var url = result.lastData
    $scope.$apply(function () {
      $scope.debugCommand = 'adb connect ' + url
    })
  })
}
