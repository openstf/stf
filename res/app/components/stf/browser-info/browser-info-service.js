// NOTE: Most of the detections stuff from Modernizr 3.0
module.exports = function BrowserInfoServiceFactory() {
  var service = {}

  var domPrefixes = 'Webkit Moz O ms'.toLowerCase().split(' ')

  function createElement() {
    return document.createElement.apply(document, arguments)
  }

  function hasEvent() {
    return (function (undefined) {
      function isEventSupportedInner(eventName, element) {
        var isSupported
        if (!eventName) {
          return false
        }
        if (!element || typeof element === 'string') {
          element = createElement(element || 'div')
        }
        eventName = 'on' + eventName
        isSupported = eventName in element
        return isSupported
      }

      return isEventSupportedInner
    })()
  }

  function addTest(key, test) {
    service[key] = (typeof test == 'function') ? test() : test
  }

  addTest('touch', function () {
    return ('ontouchstart' in window) || window.DocumentTouch &&
      document instanceof DocumentTouch
  })

  addTest('retina', function () {
    var mediaQuery = '(-webkit-min-device-pixel-ratio: 1.5), ' +
      '(min--moz-device-pixel-ratio: 1.5), (-o-min-device-pixel-ratio: 3/2), ' +
      '(min-resolution: 1.5dppx)'
    if (window.devicePixelRatio > 1) {
      return true
    }
    return !!(window.matchMedia && window.matchMedia(mediaQuery).matches)
  })

  addTest('small', function () {
    var windowWidth = window.screen.width < window.outerWidth ?
      window.screen.width : window.outerWidth
    return windowWidth < 800
//    return !!(window.matchMedia &&
//      window.matchMedia('only screen and (max-width: 760px)').matches)
  })

  addTest('mobile', function () {
    return !!(service.small && service.touch)
  })

  addTest('os', function () {
    var ua = navigator.userAgent
    if (ua.match(/Android/i)) {
      return 'android'
    } else if (ua.match(/iPhone|iPad|iPod/i)) {
      return 'ios'
    } else {
      return 'pc'
    }
  })

  addTest('webgl', function () {
    var canvas = createElement('canvas')
    if ('supportsContext' in canvas) {
      return canvas.supportsContext('webgl') ||
        canvas.supportsContext('experimental-webgl')
    }
    return !!window.WebGLRenderingContext
  })

  addTest('generators', function () {
    try {
      /* jshint evil: true */
      new Function('function* test() {}')()
    } catch (e) {
      return false
    }
    return true
  })

  addTest('ua', navigator.userAgent)

//  addTest('pointerevents', function () {
//    var bool = false
//    var i = domPrefixes.length
//    bool = hasEvent('pointerdown')
//    while (i-- && !bool) {
//      if (hasEvent(domPrefixes[i] + 'pointerdown')) {
//        bool = true
//      }
//    }
//    return bool
//  })

  addTest('devicemotion', 'DeviceMotionEvent' in window)

  addTest('deviceorientation', 'DeviceOrientationEvent' in window)

  return service
}
