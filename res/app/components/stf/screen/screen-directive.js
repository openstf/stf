var FastImageRender = require('./fast-image-render').FastImageRender

module.exports = function DeviceScreenDirective($document, ScalingService) {
  return {
    restrict: 'E',
    template: require('./screen.jade'),
    link: function (scope, element, attrs) {
      var canvas = element.find('canvas')[0]
        , imageRender = new FastImageRender(canvas, {render: 'canvas'})
        , finger = element.find('span')
        , input = element.find('textarea')
        , displayWidth = 0  // TODO: cache inside FastImageRender?
        , displayHeight = 0
        , cachedDisplayWidth = 0
        , cachedDisplayHeight = 0
        , loading = false
        , scaler

      function sendTouch(type, e) {
        var scaled = scaler.coords(
          displayWidth
        , displayHeight
        , e.offsetX
        , e.offsetY
        )

        finger[0].style.webkitTransform =
          'translate3d(' + e.offsetX + 'px,' + e.offsetY + 'px,0)'

        scope.control[type](
            scaled.xP * scope.device.display.width
          , scaled.yP * scope.device.display.height
        )
      }

      function stopTouch() {
        element.removeClass('fingering')
        element.unbind('mousemove', moveListener)
        $document.unbind('mouseup', upListener)
        $document.unbind('mouseleave', upListener)
      }

      function updateDisplaySize() {
        displayWidth = element[0].offsetWidth
        displayHeight = element[0].offsetHeight

        // Developer error, let's try to reduce debug time
        if (!displayWidth || !displayHeight) {
          throw new Error(
            'Unable to update display size; container must have dimensions'
          )
        }
      }

      function downListener(e) {
        e.preventDefault()
        input[0].focus()
        element.addClass('fingering')
        sendTouch('touchDown', e)
        element.bind('mousemove', moveListener)
        $document.bind('mouseup', upListener)
        $document.bind('mouseleave', upListener)
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
        scope.control.type(e.clipboardData.getData('text/plain'))
      }

      function maybeLoadScreen() {
        if (!loading && scope.canView && scope.showScreen && scope.device) {
          loading = true
          imageRender.load(scope.device.display.url +
            '?width=' + displayWidth +
            '&height=' + displayHeight +
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

          if (scope.canView && scope.showScreen) {

            // Check to set the size only if updated
            if (cachedDisplayWidth !== displayWidth ||
              cachedDisplayHeight !== displayHeight) {

              cachedDisplayWidth = displayWidth
              cachedDisplayHeight = displayHeight

              imageRender.canvasWidth = image.width
              imageRender.canvasHeight = image.height

              var size = scaler.projectedSize(displayWidth, displayHeight)
              imageRender.canvasStyleWidth = size.width
              imageRender.canvasStyleHeight = size.height
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
            console.log('Nothing to show')
          }
        }

        imageRender.onError = function () {
          loading = false

          scope.$apply(function () {
            scope.displayError = true
          })
        }

        updateDisplaySize()
        maybeLoadScreen()

        input.bind('keydown', keydownListener)
        input.bind('keyup', keyupListener)
        input.bind('keypress', keypressListener)
        input.bind('paste', pasteListener)
        element.bind('mousedown', downListener)
      }

      function off() {
        imageRender.onLoad = imageRender.onError = null
        loading = false
        stopTouch()
        input.unbind('keydown', keydownListener)
        input.unbind('keyup', keyupListener)
        input.unbind('keypress', keypressListener)
        input.unbind('paste', pasteListener)
        element.unbind('mousedown', downListener)
      }

      scope.$watch('canView', function (val) {
        if (val) {
          maybeLoadScreen()
        } else {
          scope.fps = null
          //imageRender.clear()
        }
      })

      scope.$watch('showScreen', function (val) {
        if (val) {
          maybeLoadScreen()
        } else {
          scope.fps = null
          //imageRender.clear()
        }
      })

      scope.$watch('device.using', function(using) {
        if (using) {
          on()
        }
        else {
          off()
        }
      })

      scope.$on('$destroy', off)
    }
  }
}
