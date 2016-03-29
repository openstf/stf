module.exports = function ScalingServiceFactory() {
  var scalingService = {
  }

  scalingService.coordinator = function(realWidth, realHeight) {
    var realRatio = realWidth / realHeight

    /**
     * Rotation affects the screen as follows:
     *
     *                   0deg
     *                 |------|
     *                 | MENU |
     *                 |------|
     *            -->  |      |  --|
     *            |    |      |    v
     *                 |      |
     *                 |      |
     *                 |------|
     *        |----|-|          |-|----|
     *        |    |M|          | |    |
     *        |    |E|          | |    |
     *  90deg |    |N|          |U|    | 270deg
     *        |    |U|          |N|    |
     *        |    | |          |E|    |
     *        |    | |          |M|    |
     *        |----|-|          |-|----|
     *                 |------|
     *            ^    |      |    |
     *            |--  |      |  <--
     *                 |      |
     *                 |      |
     *                 |------|
     *                 | UNEM |
     *                 |------|
     *                  180deg
     *
     * Which leads to the following mapping:
     *
     * |--------------|------|---------|---------|---------|
     * |              | 0deg |  90deg  |  180deg |  270deg |
     * |--------------|------|---------|---------|---------|
     * | CSS rotate() | 0deg | -90deg  | -180deg |  90deg  |
     * | bounding w   |  w   |    h    |    w    |    h    |
     * | bounding h   |  h   |    w    |    h    |    w    |
     * | pos x        |  x   |   h-y   |   w-x   |    y    |
     * | pos y        |  y   |    x    |   h-y   |   h-x   |
     * |--------------|------|---------|---------|---------|
     */
    return {
      coords: function(boundingW, boundingH, relX, relY, rotation) {
        var w, h, x, y, ratio, scaledValue

        switch (rotation) {
        case 0:
          w = boundingW
          h = boundingH
          x = relX
          y = relY
          break
        case 90:
          w = boundingH
          h = boundingW
          x = boundingH - relY
          y = relX
          break
        case 180:
          w = boundingW
          h = boundingH
          x = boundingW - relX
          y = boundingH - relY
          break
        case 270:
          w = boundingH
          h = boundingW
          x = relY
          y = boundingW - relX
          break
        }

        ratio = w / h

        if (realRatio > ratio) {
          // covers the area horizontally
          scaledValue = w / realRatio

          // adjust y to start from the scaled top edge
          y -= (h - scaledValue) / 2

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
          else if (x > w) {
            x = w
          }

          h = scaledValue
        }
        else {
          // covers the area vertically
          scaledValue = h * realRatio

          // adjust x to start from the scaled left edge
          x -= (w - scaledValue) / 2

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
          else if (y > h) {
            y = h
          }

          w = scaledValue
        }

        return {
          xP: x / w
        , yP: y / h
        }
      }
    , size: function(sizeWidth, sizeHeight) {
        var width = sizeWidth
        var height = sizeHeight
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
    , projectedSize: function(boundingW, boundingH, rotation) {
        var w, h

        switch (rotation) {
        case 0:
        case 180:
          w = boundingW
          h = boundingH
          break
        case 90:
        case 270:
          w = boundingH
          h = boundingW
          break
        }

        var ratio = w / h

        if (realRatio > ratio) {
          // covers the area horizontally
          h = Math.floor(w / realRatio)
        }
        else {
          w = Math.floor(h * realRatio)
        }

        return {
          width: w
        , height: h
        }
      }
    }
  }

  return scalingService
}
