var FastImageRender = require('./fast-image-render').FastImageRender
var _ = require('lodash')

module.exports = function DeviceScreenDirective($document, ScalingService,
  VendorUtil, PageVisibilityService, BrowserInfo, $timeout) {
  return {
    restrict: 'E',
    template: require('./screen.jade'),
    link: function (scope, element) {
      var canvas = element.find('canvas')[0]
      var imageRender = new FastImageRender(canvas, {
        render: 'canvas',
        timeout: 3000
      })
      var guestDisplayDensity = setDisplayDensity(1.5)
      //var guestDisplayRotation = 0
      var finger = element.find('span')
      var input = element.find('input')
      var boundingWidth = 0  // TODO: cache inside FastImageRender?
      var boundingHeight = 0
      var cachedBoundingWidth = 0
      var cachedBoundingHeight = 0
      var cachedImageWidth = 0
      var cachedImageHeight = 0
      var cachedRotation = 0
      var rotation = 0
      var loading = false
      var scaler
      var seq = 0
      var cssTransform = VendorUtil.style(['transform', 'webkitTransform'])

      // NOTE: instead of fa-pane-resize, a fa-child-pane-resize could be better
      var onPanelResizeThrottled = _.throttle(updateBounds, 16)
      scope.$on('fa-pane-resize', onPanelResizeThrottled)

      function setDisplayDensity(forRetina) {
        // FORCE
        forRetina = 1.2

        guestDisplayDensity =
          BrowserInfo.mobile && BrowserInfo.retina ? forRetina : 1
        return guestDisplayDensity
      }

      function sendTouch(type, e) {
        var x = e.offsetX || e.layerX || 0
        var y = e.offsetY || e.layerY || 0
        var r = scope.device.display.rotation

        if (BrowserInfo.touch) {
          if (e.touches && e.touches.length) {
            x = e.touches[0].pageX
            y = e.touches[0].pageY
          } else if (e.changedTouches && e.changedTouches.length) {
            x = e.changedTouches[0].pageX
            y = e.changedTouches[0].pageY
          }
        }

        var scaled = scaler.coords(boundingWidth, boundingHeight, x, y, r)

        finger[0].style[cssTransform] =
          'translate3d(' + x + 'px,' + y + 'px,0)'

        scope.control[type](
          seq++, scaled.xP, scaled.yP
        )
      }

      function stopTouch() {
        element.removeClass('fingering')
        if (BrowserInfo.touch) {
          element.unbind('touchmove', moveListener)
          $document.unbind('touchend', upListener)
          $document.unbind('touchleave', upListener)
        } else {
          element.unbind('mousemove', moveListener)
          $document.unbind('mouseup', upListener)
          $document.unbind('mouseleave', upListener)
        }
        seq = 0
      }

      function updateBounds() {
        boundingWidth = element[0].offsetWidth
        boundingHeight = element[0].offsetHeight

        // TODO: element is an object HTMLUnknownElement in IE9

        // Developer error, let's try to reduce debug time
        if (!boundingWidth || !boundingHeight) {
          throw new Error(
            'Unable to update display size; container must have dimensions'
          )
        }
      }

      function downListener(e) {
        e.preventDefault()
        if (!BrowserInfo.touch) {
          input[0].focus()
          element.addClass('fingering')
        }

        sendTouch('touchDown', e)

        if (BrowserInfo.touch) {
          element.bind('touchmove', moveListener)
          $document.bind('touchend', upListener)
          $document.bind('touchleave', upListener)
        } else {
          element.bind('mousemove', moveListener)
          $document.bind('mouseup', upListener)
          $document.bind('mouseleave', upListener)
        }
      }

      function moveListener(e) {
        sendTouch('touchMove', e)
      }

      function upListener(e) {
        sendTouch('touchUp', e)
        stopTouch()
      }

      function isChangeCharsetKey(e) {
        // Add any special key here for changing charset
        //console.log('e', e)

        // Chrome/Safari/Opera
        if (
          // Mac | Kinesis keyboard | Karabiner | Latin key, Kana key
        e.keyCode === 0 && e.keyIdentifier === 'U+0010' ||

          // Mac | MacBook Pro keyboard | Latin key, Kana key
        e.keyCode === 0 && e.keyIdentifier === 'U+0020' ||

          // Win | Lenovo X230 keyboard | Alt+Latin key
        e.keyCode === 246 && e.keyIdentifier === 'U+00F6' ||

          // Win | Lenovo X230 keyboard | Convert key
        e.keyCode === 28 && e.keyIdentifier === 'U+001C'
        ) {
          return true
        }

        // Firefox
        switch (e.key) {
          case 'Convert': // Windows | Convert key
          case 'Alphanumeric': // Mac | Latin key
          case 'RomanCharacters': // Windows/Mac | Latin key
          case 'KanjiMode': // Windows/Mac | Kana key
            return true
        }

        return false
      }

      function keyupSpecialKeys(e) {
        var specialKey = false

        if (isChangeCharsetKey(e)) {
          specialKey = true
          scope.control.keyPress('switch_charset')
        }

        if (specialKey) {
          e.preventDefault()
        }

        return specialKey
      }

      function keydownListener(e) {
        scope.control.keyDown(e.keyCode)
      }

      function keyupListener(e) {
        if (!keyupSpecialKeys(e)) {
          scope.control.keyUp(e.keyCode)
        }
      }

      function keypressListener(e) {
        e.preventDefault() // no need to change value
        scope.control.type(String.fromCharCode(e.charCode))
      }

      function pasteListener(e) {
        e.preventDefault() // no need to change value
        scope.control.paste(e.clipboardData.getData('text/plain'))
      }

      function copyListener(e) {
        scope.control.getClipboardContent()
        // @TODO: OK, this basically copies last clipboard content
        if (scope.control.clipboardContent) {
          e.clipboardData.setData("text/plain", scope.control.clipboardContent)
        }
        e.preventDefault()
      }

      scope.retryLoadingScreen = function () {
        if (scope.displayError === 'secure') {
          scope.control.home()
        }
        $timeout(maybeLoadScreen, 3000)
      }

      function maybeLoadScreen() {
        if (!loading && scope.$parent.showScreen && scope.device) {
          loading = true
          imageRender.load(scope.device.display.url +
            '?width=' + Math.ceil(boundingWidth * guestDisplayDensity) +
            '&height=' + Math.ceil(boundingHeight * guestDisplayDensity) +
            '&time=' + Date.now()
          )
        }
      }

      function on() {
        scaler = ScalingService.coordinator(
          scope.device.display.width, scope.device.display.height
        )

        imageRender.onLoad = function (image) {
          loading = false

          if (scope.$parent.showScreen) {

            // Check to set the size only if updated
            if (cachedBoundingWidth !== boundingWidth ||
              cachedBoundingHeight !== boundingHeight ||
              cachedImageWidth !== image.width ||
              cachedImageHeight !== image.height ||
              cachedRotation !== rotation) {

              cachedBoundingWidth = boundingWidth
              cachedBoundingHeight = boundingHeight

              cachedImageWidth = image.width
              cachedImageHeight = image.height

              cachedRotation = rotation

              imageRender.canvasWidth = cachedImageWidth
              imageRender.canvasHeight = cachedImageHeight

              var size = scaler.projectedSize(
                boundingWidth, boundingHeight, rotation
              )

              imageRender.canvasStyleWidth = size.width
              imageRender.canvasStyleHeight = size.height

              // @todo Make sure that each position is able to rotate smoothly
              // to the next one. This current setup doesn't work if rotation
              // changes from 180 to 270 (it will do a reverse rotation).
              switch (rotation) {
                case 0:
                  canvas.style[cssTransform] = 'rotate(0deg)'
                  break
                case 90:
                  canvas.style[cssTransform] = 'rotate(-90deg)'
                  break
                case 180:
                  canvas.style[cssTransform] = 'rotate(-180deg)'
                  break
                case 270:
                  canvas.style[cssTransform] = 'rotate(90deg)'
                  break
              }
            }

            imageRender.draw(image)

            // Reset error, if any
            if (scope.displayError) {
              scope.$apply(function () {
                scope.displayError = false
              })
            }

            // Next please
            maybeLoadScreen()
          }
          // Else: Nothing to show
        }

        imageRender.onError = function (type) {
          loading = false

          scope.$apply(function () {
            if (type === 'timeout') {
              scope.displayError = 'timeout'
            } else {
              scope.displayError = 'secure'
            }
          })
        }

        updateBounds()
        maybeLoadScreen()

        input.bind('keydown', keydownListener)
        input.bind('keyup', keyupListener)
        input.bind('keypress', keypressListener)
        input.bind('paste', pasteListener)
        input.bind('copy', copyListener)

        if (BrowserInfo.touch) {
          element.bind('touchstart', downListener)
        } else {
          element.bind('mousedown', downListener)
        }

      }

      function off() {
        imageRender.onLoad = imageRender.onError = null
        loading = false
        stopTouch()
        input.unbind('keydown', keydownListener)
        input.unbind('keyup', keyupListener)
        input.unbind('keypress', keypressListener)
        input.unbind('paste', pasteListener)
        input.unbind('copy', copyListener)

        if (BrowserInfo.touch) {
          element.unbind('touchstart', downListener)
        } else {
          element.unbind('mousedown', downListener)
        }
      }

      scope.$watch('$parent.showScreen', function (val) {
        if (val) {
          maybeLoadScreen()
        } else {
          scope.fps = null
          imageRender.clear()
        }
      })

      function checkEnabled() {
        var using = scope.device && scope.device.using
        if (using && !PageVisibilityService.hidden) {
          on()
        }
        else {
          off()
        }
      }

      scope.$watch('device.using', checkEnabled)
      scope.$on('visibilitychange', checkEnabled)

      scope.$watch('device.display.rotation', function (r) {
        rotation = r || 0
      })

      scope.$on('guest-portrait', function () {
        scope.control.rotate(0)
        updateBounds()
      })

      scope.$on('guest-landscape', function () {
        scope.control.rotate(90)
        setDisplayDensity(2)
        updateBounds()
      })

      scope.$on('$destroy', off)
    }
  }
}
