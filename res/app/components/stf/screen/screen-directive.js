var FastImageRender = require('./fast-image-render').FastImageRender

module.exports = function DeviceScreenDirective($document, ScalingService, VendorUtil, PageVisibilityService, BrowserInfo, $timeout) {
  return {
    restrict: 'E',
    template: require('./screen.jade'),
    link: function (scope, element) {
      var canvas = element.find('canvas')[0]
        , imageRender = new FastImageRender(canvas, {render: 'canvas', timeout: 1000})
        , guestDisplayDensity = setDisplayDensity(1.5)
        , guestDisplayRotation = 0
        , finger = element.find('span')
        , input = element.find('textarea')
        , boundingWidth = 0  // TODO: cache inside FastImageRender?
        , boundingHeight = 0
        , cachedBoundingWidth = 0
        , cachedBoundingHeight = 0
        , cachedImageWidth = 0
        , cachedImageHeight = 0
        , cachedRotation = 0
        , rotation = 0
        , loading = false
        , scaler
        , seq = 0
        , cssTransform = VendorUtil.style(['transform', 'webkitTransform'])

      scope.$on('panelsResized', updateBounds)

      function setDisplayDensity(forRetina) {
        return guestDisplayDensity = BrowserInfo.mobile && BrowserInfo.retina ? forRetina : 1
      }

      function sendTouch(type, e) {
        var x = e.offsetX || e.layerX || 0
        var y = e.offsetY || e.layerY || 0
        var r = scope.device.display.orientation

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
          seq++
          , scaled.xP
          , scaled.yP
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

      function keydownListener(e) {
        scope.control.keyDown(e.keyCode)
      }

      function keyupListener(e) {
        scope.control.keyUp(e.keyCode)
      }

      function keypressListener(e) {
        e.preventDefault() // no need to change value
        scope.control.type(String.fromCharCode(e.charCode))
      }

      function pasteListener(e) {
        e.preventDefault() // no need to change value
        scope.control.paste(e.clipboardData.getData('text/plain'))
      }

      function getTextDiffered() {
        return 'new text' + 5
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
        $timeout(maybeLoadScreen, 1000)
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
          scope.device.display.width
          , scope.device.display.height
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
                boundingWidth
                , boundingHeight
                , rotation
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
          } else {
            // Nothing to show
          }
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

      scope.$watch('device.display.orientation', function (r) {
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
