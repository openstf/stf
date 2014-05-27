module.exports = function landscapeDirective(BrowserInfo, $document, $window, $rootScope) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      console.log($window.orientation)

      if (typeof $window.orientation !== 'undefined') {
        if ($window.orientation === 0) {
          rotateHostAndGuest(true)
        } else {
          rotateHostAndGuest(false)
        }
      }

      function rotateHostAndGuest(portrait) {
        //console.log(scope.control)
        if (portrait) {
          if (scope.control) {
            scope.control.rotate(0)
          }
          angular.element($document[0].body).addClass('guest-portrait')
          angular.element($document[0].body).removeClass('guest-landscape')
        } else {
          if (scope.control) {
            scope.control.rotate(90)
          }
          angular.element($document[0].body).addClass('guest-landscape')
          angular.element($document[0].body).removeClass('guest-portrait')
        }
      }

      function guestDisplayRotatated(eventData) {
        var isPortrait = (window.innerHeight > window.innerWidth)
        rotateHostAndGuest(isPortrait)
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
