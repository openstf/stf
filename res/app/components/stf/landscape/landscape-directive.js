module.exports = function landscapeDirective(BrowserInfo, $document, $window, $rootScope) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var body = angular.element($document[0].body)

      if (typeof $window.orientation !== 'undefined') {
        if ($window.orientation === 0) {
          //rotateGuest(true)
        } else {
          rotateGuest(false)
        }
      }

      function rotateGuest(portrait) {
        if (portrait) {
          body.addClass('guest-portrait')
          body.removeClass('guest-landscape')

          scope.$broadcast('guest-portrait')
        } else {
          body.addClass('guest-landscape')
          body.removeClass('guest-portrait')

          scope.$broadcast('guest-landscape')

          $window.scrollTo(0,0)
        }
      }

      function guestDisplayRotatated(eventData) {
        var isPortrait = (window.innerHeight > window.innerWidth)
        rotateGuest(isPortrait)
      }

      if (BrowserInfo.deviceorientation) {
        window.addEventListener('orientationchange', guestDisplayRotatated, true)
      }

      function off() {
        if (BrowserInfo.deviceorientation) {
          window.removeEventListener('orientationchange', guestDisplayRotatated)
        }
      }

      scope.$on('$destroy', off)
    }
  }
}
