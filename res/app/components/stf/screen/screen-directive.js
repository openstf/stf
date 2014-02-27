var FastImageLoader = require('./fast-image-render').FastImageLoader
var FastImageRender = require('./fast-image-render').FastImageRender

module.exports = function DeviceScreenDirective($document, ScalingService, $rootScope) {
  return {
    restrict: 'E',
    template: require('./screen.jade'),
    link: function (scope, element, attrs) {
      scope.device.promise.then(function (device) {
        var imageLoader = new FastImageLoader()
          , canvas = element.find('canvas')[0]
          , imageRender = new FastImageRender(canvas, {render: 'canvas'})
          , finger = element.find('span')
          , input = element.find('textarea')
          , displayWidth = 0  // TODO: cache inside FastImageRender?
          , displayHeight = 0
          , cachedDisplayWidth = 0
          , cachedDisplayHeight = 0
          , scaler = ScalingService.coordinator(
            device.display.width
            , device.display.height
          )

        $rootScope.$on('pageHidden', function () {
          scope.canView = false
        })

        $rootScope.$on('pageVisible', function () {
          scope.canView = true
        })

        scope.$watch('canView', function (val) {
          if (val) {
            loadScreen()
          } else {
            scope.fps = null
            //imageRender.clear()
          }
        })

        scope.$watch('showScreen', function (val) {
          if (val) {
            loadScreen();
          } else {
            scope.fps = null
            //imageRender.clear()
          }
        })

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

        function loadScreen() {
          imageLoader.load(device.display.url +
              '?width=' + displayWidth +
              '&height=' + displayHeight +
              '&time=' + Date.now()
          )
        }

        imageLoader.onLoad = function (image) {
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
            loadScreen()
          } else {
            console.log('Nothing to show')
          }

        }

        imageLoader.onError = function () {
          scope.$apply(function () {
            scope.displayError = true
          })
        }

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
              scaled.xP * device.display.width
            , scaled.yP * device.display.height
          )
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
          stop()
        }

        function stop() {
          element.removeClass('fingering')
          element.unbind('mousemove', moveListener)
          $document.unbind('mouseup', upListener)
          $document.unbind('mouseleave', upListener)
        }

        scope.$on('$destroy', function () {
          loader.onload = loader.onerror = null
          stop()
        })

        input.bind('keydown', function (e) {
          scope.control.keyDown(e.keyCode)
        })

        input.bind('keyup', function (e) {
          scope.control.keyUp(e.keyCode)
        })

        input.bind('keypress', function (e) {
          e.preventDefault() // no need to change value
          scope.control.type(String.fromCharCode(e.charCode))
        })

        input.bind('paste', function (e) {
          e.preventDefault() // no need to change value
          scope.control.type(e.clipboardData.getData('text/plain'))
        })

        element.bind('mousedown', downListener)
        updateDisplaySize()
        loadScreen()
      })
    }
  }
}
