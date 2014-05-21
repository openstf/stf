module.exports = function LogsCtrl($scope, LogcatService) {

  var filters = []

  $scope.logEntries = LogcatService.entries

  $scope.started = LogcatService.started

  $scope.filters = {}

  $scope.filters.levelNumbers = LogcatService.filters.levelNumbers

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

  window.onbeforeunload = function () {
    $scope.control.stopLogcat()
  }

  $scope.clear = function () {
    LogcatService.clear()
  }

  function defineFilterWatchers(props) {
    angular.forEach(props, function (prop) {
      $scope.$watch('filters.' + prop, function (newValue, oldValue) {
        if (!angular.equals(newValue, oldValue)) {
          LogcatService.filters[prop] = newValue
        }
      })
    })
  }

  defineFilterWatchers([
    'levelNumber',
    'message',
    'pid',
    'tid',
    'dateLabel',
    'date',
    'tag',
    'priority'
  ])

//  $scope.$watchCollection('filters', function (newValue, oldValue) {
//    console.log(newValue)
//  });


}
