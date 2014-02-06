define(['./_module'], function(app) {
  function ScalingServiceFactory() {
    var scalingService = {
    }

    scalingService.coordinator = function(realWidth, realHeight) {
      var realRatio = realWidth / realHeight

      return {
        coords: function(width, height, x, y) {
          var ratio = width / height
            , scaledValue

          if (realRatio > ratio) {
            // covers the area horizontally
            scaledValue = width / realRatio;

            // adjust y to start from the scaled top edge
            y -= (height - scaledValue) / 2

            // not touching the screen, but we want to trigger certain events
            // (like touchup) anyway, so let's do it on the edges.
            if (y < 0) {
              y = 0
            }
            else if (y > scaledValue) {
              y = scaledValue
            }

            // make sure x is within bounds too
            if (x < 0) {
              x = 0
            }
            else if (x > width) {
              x = width
            }

            height = scaledValue
          }
          else {
            // covers the area vertically
            scaledValue = height * realRatio

            // adjust x to start from the scaled left edge
            x -= (width - scaledValue) / 2

            // not touching the screen, but we want to trigger certain events
            // (like touchup) anyway, so let's do it on the edges.
            if (x < 0) {
              x = 0
            }
            else if (x > scaledValue) {
              x = scaledValue
            }

            // make sure y is within bounds too
            if (y < 0) {
              y = 0
            }
            else if (y > height) {
              y = height
            }

            width = scaledValue
          }

          return {
            xP: x / width
          , yP: y / height
          }
        }
      , size: function(width, height) {
          var ratio = width / height

          if (realRatio > ratio) {
            // covers the area horizontally

            if (width >= realWidth) {
              // don't go over max size
              width = realWidth
              height = realHeight
            }
            else {
              height = Math.floor(width / realRatio)
            }
          }
          else {
            // covers the area vertically

            if (height >= realHeight) {
              // don't go over max size
              height = realHeight
              width = realWidth
            }
            else {
              width = Math.floor(height * realRatio)
            }
          }

          return {
            width: width
          , height: height
          }
        }
      , projectedSize: function(width, height) {
          var ratio = width / height

          if (realRatio > ratio) {
            // covers the area horizontally
            height = Math.floor(width / realRatio)
          }
          else {
            width = Math.floor(height * realRatio)
          }

          return {
            width: width
          , height: height
          }
        }
      }
    }

    return scalingService
  }

  app.factory('ScalingService', [ScalingServiceFactory])
})
