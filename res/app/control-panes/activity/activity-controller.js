module.exports = function ActivityCtrl($scope, gettext, TimelineService) {
  $scope.timeline = TimelineService

  $scope.$watch('device.state', function(newValue, oldValue) {

    if (newValue !== oldValue) {

      var title = ''
      var message = ''

      if (oldValue === 'using') {

        title = newValue
        message = 'Device is now ' + newValue


      } else {
        title = newValue
        message = '!Device is now ' + newValue
      }

      $scope.timeline.info({
        title: title,
        message: message,
        serial: $scope.device.serial
      })

    }


  }, true)
}
