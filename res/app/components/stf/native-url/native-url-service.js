module.exports = function NativeUrlServiceFactory($window, $timeout) {
  var service = {}

  // Ways of opening native URLs:
  // - window.open
  // - window.location.href

  // Ways of detecting failure:
  // - new window timeout
  // - window onblur timeout
  // - javascript single thread time elapsed

  // Browser Behaviours:
  // - Chrome Mac: 25ms timeout OK
  // - Firefox Mac: 250ms timeout OK, 1000ms timeout better
  // - Safari Mac: no working fallback, may need 2 html pages
  // navigator.userAgent.match()
  // TODO: Find which method works well in every browser

  var fallbackMethod = 'USE_ON_BLUR'

  var wasBlured = false
  var windowOpened

  // TODO: use a central on-blur event
  var cachedWindowOnBlur = $window.onblur

  service.open = function(options) {

    switch (fallbackMethod) {
      case 'USE_NEW_WINDOW':
        // Doesn't work well on Chrome
        windowOpened = $window.open(options.nativeUrl)

        $timeout(function() {
          if (windowOpened) {
            windowOpened.close()
          }
        }, 500)

        $window.location.href = options.webUrl
        break
      case 'USE_ON_BLUR':
        // Doesn't work on Safari

        $window.onblur = function() {
          wasBlured = true
        }

        $window.location.href = options.nativeUrl

        $timeout(function() {
          if (wasBlured) {
            wasBlured = false
          } else {
            $window.open(options.webUrl, '_blank')
          }

          $window.onblur = cachedWindowOnBlur
        }, 250)

        break
      case 'USE_TIME_ELAPSED':
        // Doesn't work on Chrome

        var start, end, elapsed
        start = new Date().getTime()

        // console.log(' window.performance.webkitNow()', window.performance.now())

        // This depends on the fact that JS is single-thread
        document.location = options.nativeUrl

        end = new Date().getTime()

        elapsed = (end - start)

        if (elapsed < 1) {
          document.location = options.webUrl
        }

        break
      default:
    }

  }

  return service
}
