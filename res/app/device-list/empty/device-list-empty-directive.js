module.exports = function DeviceListEmptyDirective() {
  return {
    restrict: 'E'
  , template: require('./device-list-empty.jade')
  , scope: {
      tracker: '&tracker'
    }
  , link: function(scope) {
      var tracker = scope.tracker()

      scope.empty = !tracker.devices.length

      function update() {
        var oldEmpty = scope.empty
        var newEmpty = !tracker.devices.length

        if (oldEmpty !== newEmpty) {
          scope.$apply(function() {
            scope.empty = newEmpty
          })
        }
      }

      tracker.on('add', update)
      tracker.on('change', update)
      tracker.on('remove', update)

      scope.$on('$destroy', function() {
        tracker.removeListener('add', update)
        tracker.removeListener('change', update)
        tracker.removeListener('remove', update)
      })
    }
  }
}
