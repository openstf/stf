module.exports = function LogsCtrl($scope, LogcatService) {

  var filters = []

  $scope.logEntries = LogcatService.entries


  $scope.$watch('started', function (newValue, oldValue) {
    if (newValue !== oldValue) {

      if (newValue) {
        $scope.control.startLogcat(filters).then(function (result) {

        })
      } else {
        $scope.control.stopLogcat()
      }

    }
  })

  $scope.clear = function () {
    LogcatService.clear()
  }
}
