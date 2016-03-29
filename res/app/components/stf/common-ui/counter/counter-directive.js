module.exports = function counterDirective($timeout) {
  return {
    replace: false,
    scope: true,
    link: function(scope, element, attrs) {
      var el = element[0]
      var num, refreshInterval, duration, steps, step, countTo, increment

      var calculate = function() {
        refreshInterval = 32
        step = 0
        scope.timoutId = null
        countTo = parseInt(attrs.countTo, 10) || 0
        scope.value = parseInt(attrs.countFrom, 10) || 0
        duration = parseFloat(attrs.duration) || 0

        steps = Math.ceil(duration / refreshInterval)

        increment = ((countTo - scope.value) / steps)
        num = scope.value
      }

      var tick = function() {
        scope.timoutId = $timeout(function() {
          num += increment
          step++
          if (step >= steps) {
            $timeout.cancel(scope.timoutId)
            num = countTo
            el.innerText = countTo
          }
          else {
            el.innerText = Math.round(num)
            tick()
          }
        }, refreshInterval)

      }

      var start = function() {
        if (scope.timoutId) {
          $timeout.cancel(scope.timoutId)
        }
        calculate()
        tick()
      }

      attrs.$observe('countTo', function(val) {
        if (val) {
          start()
        }
      })

      attrs.$observe('countFrom', function() {
        start()
      })

      return true
    }
  }

}
