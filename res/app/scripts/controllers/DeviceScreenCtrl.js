define(['./_module'], function(app) {
  function DeviceScreenCtrl($scope, scalingService) {
    $scope.ready = false
    $scope.displayError = false
    $scope.scalingService = scalingService

    $scope.promiseOfDevice.then(function() {
      $scope.ready = true
    })
  }

  function DeviceScreenDirective($document, scalingService) {
    return {
      restrict: 'E'
    , templateUrl: 'partials/devices/screen'
    , link: function($scope, element, attrs) {
        $scope.promiseOfDevice.then(function(device) {
          var loader = new Image()
            , canvas = element.find('canvas')[0]
            , g = canvas.getContext('2d')
            , displayWidth = 0
            , displayHeight = 0
            , scaler = scalingService.coordinator(
                device.display.width
              , device.display.height
              )

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
            loader.src = device.display.url +
              '?width=' + displayWidth +
              '&height=' + displayHeight +
              '&time=' + Date.now()
          }

          loader.onload = function() {
            var size = scaler.projectedSize(displayWidth, displayHeight)

            // Make sure we're rendering pixels 1 to 1
            canvas.width = this.width
            canvas.height = this.height

            // Perhaps we have a massive screen but not enough pixels. Let's
            // scale up
            canvas.style.width = size.width + 'px'
            canvas.style.height = size.height + 'px'

            // Draw the image
            g.drawImage(this, 0, 0)

            // Reset error, if any
            if ($scope.displayError) {
              $scope.$apply(function() {
                $scope.displayError = false
              })
            }

            // Next please
            loadScreen()
          }

          loader.onerror = function() {
            $scope.$apply(function() {
              $scope.displayError = true
            })
          }

          function sendTouch(type, e) {
            var scaled = scaler.coords(
              displayWidth
            , displayHeight
            , e.offsetX
            , e.offsetY
            )

            $scope.control[type](
              scaled.xP * device.display.width
            , scaled.yP * device.display.height
            )
          }

          function downListener(e) {
            e.preventDefault()
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
            element.unbind('mousemove', moveListener)
            $document.unbind('mouseup', upListener)
            $document.unbind('mouseleave', upListener)
          }

          $scope.$on('$destroy', function() {
            loader.onload = loader.onerror = null
            $document.unbind('mouseup', upListener)
            $document.unbind('mouseleave', upListener)
          })

          element.bind('mousedown', downListener)
          updateDisplaySize()
          loadScreen()
        })
      }
    }
  }

  app.controller('DeviceScreenCtrl'
  , [ '$scope'
    , 'ScalingService'
    , DeviceScreenCtrl
    ])
    .directive('deviceScreen'
    , [ '$document'
      , 'ScalingService'
      , DeviceScreenDirective
      ])
})
