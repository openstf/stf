// NOTE: Most of the detection stuff is from Modernizr 3.0
module.exports = function BrowserInfoServiceFactory() {
  var service = {}

  function createElement() {
    return document.createElement.apply(document, arguments)
  }

  function addTest(key, test) {
    service[key] = (typeof test == 'function') ? test() : test
  }

  addTest('touch', function() {
    return ('ontouchstart' in window) || window.DocumentTouch &&
    document instanceof window.DocumentTouch
  })

  addTest('retina', function() {
    var mediaQuery = '(-webkit-min-device-pixel-ratio: 1.5), ' +
      '(min--moz-device-pixel-ratio: 1.5), (-o-min-device-pixel-ratio: 3/2), ' +
      '(min-resolution: 1.5dppx)'
    if (window.devicePixelRatio > 1) {
      return true
    }
    return !!(window.matchMedia && window.matchMedia(mediaQuery).matches)
  })

  addTest('small', function() {
    var windowWidth = window.screen.width < window.outerWidth ?
      window.screen.width : window.outerWidth
    return windowWidth < 800
  })

  addTest('mobile', function() {
    return !!(service.small && service.touch)
  })

  addTest('os', function() {
    var ua = navigator.userAgent
    if (ua.match(/Android/i)) {
      return 'android'
    }
    else if (ua.match(/iPhone|iPad|iPod/i)) {
      return 'ios'
    }
    else {
      return 'pc'
    }
  })

  addTest('webgl', function() {
    var canvas = createElement('canvas')
    if ('supportsContext' in canvas) {
      return canvas.supportsContext('webgl') ||
      canvas.supportsContext('experimental-webgl')
    }
    return !!window.WebGLRenderingContext
  })

  addTest('ua', navigator.userAgent)

  addTest('devicemotion', 'DeviceMotionEvent' in window)

  addTest('deviceorientation', 'DeviceOrientationEvent' in window)

  return service
}
