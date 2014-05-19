module.exports = function LogsCtrl($scope, LogcatService) {

  var filters = []

  $scope.logEntries = LogcatService.entries

  $scope.filters = LogcatService.filters

  $scope.started = LogcatService.started




  $scope.$watch('started', function (newValue, oldValue) {
    if (newValue !== oldValue) {
      LogcatService.started = newValue
      if (newValue) {
        $scope.control.startLogcat(filters).then(function (result) {
        })
      } else {
        $scope.control.stopLogcat()
      }
    }
  })

  $scope.$on('$destroy', function () {
//    $scope.control.stopLogcat()
  })

  $scope.clear = function () {
    LogcatService.clear()
  }

  $scope.addFastRow = function (val) {
    var e = {
      "serial": "1cd49783",
      "date": 1399964036.984,
      "pid": 9246,
      "tid": 9540,
      "priority": 3,
      "tag": "MobileDataStateTracker",
      "message": "default: setPolicyDataEnable(enabled=true)"
    }

    //console.log(val)
  }
}
