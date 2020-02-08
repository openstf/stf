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
          var transformedInput = ''
          switch('filters.' + prop) {
            case 'filters.pid':
                transformedInput = newValue.replace(/[^0-9:]/g, '')
                if (transformedInput !== newValue) {
                  $scope.filters.pid = transformedInput
                }
                break
            case 'filters.tid':
                transformedInput = newValue.replace(/[^0-9]/g, '')
                if (transformedInput !== newValue) {
                  $scope.filters.tid = transformedInput
                }
                break
            default:
              transformedInput = newValue
          }

          LogcatService.filters[prop] = transformedInput
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
