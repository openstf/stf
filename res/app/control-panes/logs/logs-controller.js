module.exports = function LogsCtrl($scope, LogcatService) {

  $scope.started = LogcatService.started

  $scope.filters = {}

  $scope.filters.levelNumbers = LogcatService.filters.levelNumbers

  LogcatService.filters.filterLines()

  $scope.$watch('started', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      LogcatService.started = newValue
      if (newValue) {
        $scope.control.startLogcat([]).then(function() {
        })
      } else {
        $scope.control.stopLogcat()
      }
    }
  })

  window.onbeforeunload = function() {
    if ($scope.control) {
      $scope.control.stopLogcat()
    }
  }

  $scope.clear = function() {
    LogcatService.clear()
  }

  function defineFilterWatchers(props) {
    angular.forEach(props, function(prop) {
      $scope.$watch('filters.' + prop, function(newValue, oldValue) {
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
}
