module.exports = function DeviceListStatsDirective(
  UserService
, $timeout
) {
  return {
    restrict: 'E'
  , template: require('./device-list-stats.jade')
  , scope: {
      tracker: '&tracker'
    }
  , link: function (scope) {
      var tracker = scope.tracker()
        , mapping = Object.create(null)
        , timer

      scope.counter = {
        total: 0
      , usable: 0
      , busy: 0
      , using: 0
      }

      scope.currentUser = UserService.currentUser

      function notify() {
        $timeout.cancel(timer)
        timer = $timeout(function () {
          scope.$apply()
        }, 200)
      }

      function updateStats(device) {
        return (mapping[device.serial] = {
          usable: device.usable ? 1 : 0
        , busy: device.owner ? 1 : 0
        , using: device.using ? 1 : 0
        })
      }

      function addListener(device) {
        var stats = updateStats(device)

        scope.counter.total += 1
        scope.counter.usable += stats.usable
        scope.counter.busy += stats.busy
        scope.counter.using += stats.busy

        notify()
      }

      function changeListener(device) {
        var oldStats = mapping[device.serial]
          , newStats = updateStats(device)
          , diffs = Object.create(null)

        scope.counter.usable += diffs.usable = newStats.usable - oldStats.usable
        scope.counter.busy += diffs.busy = newStats.busy - oldStats.busy
        scope.counter.using += diffs.using = newStats.using - oldStats.using

        if (diffs.usable || diffs.busy || diffs.using) {
          notify()
        }
      }

      function removeListener(device) {
        var oldStats = mapping[device.serial]
          , newStats = updateStats(device)

        scope.counter.total -= 1
        scope.counter.busy += newStats.busy - oldStats.busy
        scope.counter.using += newStats.using - oldStats.using

        delete mapping[device.serial]

        notify()
      }

      tracker.on('add', addListener)
      tracker.on('change', changeListener)
      tracker.on('remove', removeListener)

      scope.$on('$destroy', function() {
        tracker.removeListener('add', addListener)
        tracker.removeListener('change', changeListener)
        tracker.removeListener('remove', removeListener)
        $timeout.cancel(timer)
      })
    }
  }
}
