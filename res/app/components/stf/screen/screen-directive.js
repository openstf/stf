var FastImageRender = require('./fast-image-render').FastImageRender
var _ = require('lodash')

module.exports = function DeviceScreenDirective($document, ScalingService,
  VendorUtil, PageVisibilityService, BrowserInfo, $timeout) {
  return {
    restrict: 'E'
  , template: require('./screen.jade')
  , scope: {
      control: '&'
    , device: '&'
    }
  , link: function (scope, element) {
      var device = scope.device()
        , control = scope.control()

      var canvas = element.find('canvas')[0]
        , input = element.find('input')

      var imageRender = new FastImageRender(canvas, {
        render: 'canvas',
        timeout: 3000
      })
      var guestDisplayDensity = setDisplayDensity(1.5)
      //var guestDisplayRotation = 0

      var loading = false
      var cssTransform = VendorUtil.style(['transform', 'webkitTransform'])

      var screen = scope.screen = {
        scaler: ScalingService.coordinator(
          device.display.width, device.display.height
        )
      , rotation: 0
      , bounds: {
          x: 0
        , y: 0
        , w: 0
        , h: 0
        }
      , autoScaleForRetina: true
      }

      var cachedScreen = {
        rotation: 0
      , bounds: {
          x: 0
        , y: 0
        , w: 0
        , h: 0
        }
      }

      var cachedImageWidth = 0
        , cachedImageHeight = 0

      // NOTE: instead of fa-pane-resize, a fa-child-pane-resize could be better
      var onPanelResizeThrottled = _.throttle(updateBounds, 16)
      scope.$on('fa-pane-resize', onPanelResizeThrottled)

      function setDisplayDensity(forRetina) {
        // FORCE
        forRetina = 1.5

        guestDisplayDensity = BrowserInfo.retina ? forRetina : 1
        return guestDisplayDensity
      }

      function updateBounds() {
        screen.bounds.w = element[0].offsetWidth
        screen.bounds.h = element[0].offsetHeight

        // TODO: element is an object HTMLUnknownElement in IE9

        // Developer error, let's try to reduce debug time
        if (!screen.bounds.w || !screen.bounds.h) {
          throw new Error(
            'Unable to update display size; container must have dimensions'
          )
        }
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
          control.keyPress('switch_charset')
        }

        if (specialKey) {
          e.preventDefault()
        }

        return specialKey
      }

      function keydownListener(e) {
        // Prevent tab from switching focus to the next element, we only want
        // that to happen on the device side.
        if (e.keyCode === 9) {
          e.preventDefault()
        }
        control.keyDown(e.keyCode)
      }

      function keyupListener(e) {
        if (!keyupSpecialKeys(e)) {
          control.keyUp(e.keyCode)
        }
      }

      function keypressListener(e) {
        e.preventDefault() // no need to change value
        control.type(String.fromCharCode(e.charCode))
      }

      function pasteListener(e) {
        e.preventDefault() // no need to change value
        control.paste(e.clipboardData.getData('text/plain'))
      }

      function copyListener(e) {
        control.getClipboardContent()
        // @TODO: OK, this basically copies last clipboard content
        if (control.clipboardContent) {
          e.clipboardData.setData("text/plain", control.clipboardContent)
        }
        e.preventDefault()
      }

      scope.retryLoadingScreen = function () {
        if (scope.displayError === 'secure') {
          control.home()
        }
        $timeout(maybeLoadScreen, 3000)
      }

      function maybeLoadScreen() {
        var size
        if (!loading && scope.$parent.showScreen && device) {
          switch (screen.rotation) {
          case 0:
          case 180:
            size = adjustBoundedSize(
              screen.bounds.w
            , screen.bounds.h
            )
            break
          case 90:
          case 270:
            size = adjustBoundedSize(
              screen.bounds.h
            , screen.bounds.w
            )
            break
          }
          loading = true
          imageRender.load(device.display.url +
            '?width=' + size.w +
            '&height=' + size.h +
            '&time=' + Date.now()
          )
        }
      }

      function adjustBoundedSize(w, h) {
        var sw = w * guestDisplayDensity
          , sh = h * guestDisplayDensity
          , minscale = 0.36
          , f

        if (sw < (f = device.display.width * minscale)) {
          sw *= f / sw
          sh *= f / sh
        }

        if (sh < (f = device.display.height * minscale)) {
          sw *= f / sw
          sh *= f / sh
        }

        return {
          w: Math.ceil(sw)
        , h: Math.ceil(sh)
        }
      }

      function on() {
        imageRender.onLoad = function (image) {
          loading = false

          if (scope.$parent.showScreen) {
            screen.rotation = device.display.rotation

            // Check to set the size only if updated
            if (cachedScreen.bounds.w !== screen.bounds.w ||
              cachedScreen.bounds.h !== screen.bounds.h ||
              cachedImageWidth !== image.width ||
              cachedImageHeight !== image.height ||
              cachedScreen.rotation !== screen.rotation) {

              cachedScreen.bounds.w = screen.bounds.w
              cachedScreen.bounds.h = screen.bounds.h

              cachedImageWidth = image.width
              cachedImageHeight = image.height

              cachedScreen.rotation = screen.rotation

              imageRender.canvasWidth = cachedImageWidth
              imageRender.canvasHeight = cachedImageHeight

              var projectedSize = screen.scaler.projectedSize(
                screen.bounds.w
              , screen.bounds.h
              , screen.rotation
              )

              imageRender.canvasStyleWidth = projectedSize.width
              imageRender.canvasStyleHeight = projectedSize.height

              // @todo Make sure that each position is able to rotate smoothly
              // to the next one. This current setup doesn't work if rotation
              // changes from 180 to 270 (it will do a reverse rotation).
              switch (screen.rotation) {
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
      }

      function off() {
        imageRender.onLoad = imageRender.onError = null
        loading = false

        input.unbind('keydown', keydownListener)
        input.unbind('keyup', keyupListener)
        input.unbind('keypress', keypressListener)
        input.unbind('paste', pasteListener)
        input.unbind('copy', copyListener)
      }

      scope.$watch('$parent.showScreen', function (val) {
        if (val) {
          updateBounds()
          maybeLoadScreen()
        } else {
          scope.fps = null
          imageRender.clear()
        }
      })

      function checkEnabled() {
        var using = device && device.using
        if (using && !PageVisibilityService.hidden) {
          on()
        }
        else {
          off()
        }
      }

      scope.$watch('device.using', checkEnabled)
      scope.$on('visibilitychange', checkEnabled)

      scope.$on('guest-portrait', function () {
        control.rotate(0)
        updateBounds()
      })

      scope.$on('guest-landscape', function () {
        control.rotate(90)
        setDisplayDensity(2)
        updateBounds()
      })

      scope.$on('$destroy', off)

      // @todo Move everything below this line elsewhere.
      var slots = []
        , slotted = Object.create(null)
        , fingers = []
        , seq = -1
        , cycle = 100
        , fakePinch = false

      function nextSeq() {
        return ++seq >= cycle ? (seq = 0) : seq
      }

      function createSlots() {
        // The reverse order is important because slots and fingers are in
        // opposite sort order. Anyway don't change anything here unless
        // you understand what it does and why.
        for (var i = 9; i >= 0; --i) {
          var finger = createFinger(i)
          element.append(finger)
          slots.push(i)
          fingers.unshift(finger)
        }
      }

      function activateFinger(index, x, y, pressure) {
        var scale = 0.5 + pressure
        fingers[index].classList.add('active')
        fingers[index].style[cssTransform] =
          'translate3d(' + x + 'px,' + y + 'px,0) ' +
          'scale(' + scale + ',' + scale + ')'
      }

      function deactivateFinger(index) {
        fingers[index].classList.remove('active')
      }

      function deactivateFingers() {
        for (var i = 0, l = fingers.length; i < l; ++i) {
          fingers[i].classList.remove('active')
        }
      }

      function createFinger(index) {
        var el = document.createElement('span')
        el.className = 'finger finger-' + index
        return el
      }

      function calculateBounds() {
        var el = element[0]

        screen.bounds.w = el.offsetWidth
        screen.bounds.h = el.offsetHeight
        screen.bounds.x = 0
        screen.bounds.y = 0

        while (el.offsetParent) {
          screen.bounds.x += el.offsetLeft
          screen.bounds.y += el.offsetTop
          el = el.offsetParent
        }
      }

      function mouseDownListener(e) {
        if (e.originalEvent) {
          e = e.originalEvent
        }

        // Skip secondary click
        if (e.which === 3) {
          return
        }

        e.preventDefault()

        fakePinch = e.altKey

        calculateBounds()
        startMousing()

        var x = e.pageX - screen.bounds.x
          , y = e.pageY - screen.bounds.y
          , pressure = 0.5
          , scaled = screen.scaler.coords(
              screen.bounds.w
            , screen.bounds.h
            , x
            , y
            , screen.rotation
            )

        control.touchDown(nextSeq(), 0, scaled.xP, scaled.yP, pressure)

        if (fakePinch) {
          control.touchDown(nextSeq(), 1, 1 - scaled.xP, 1 - scaled.yP,
            pressure)
        }

        control.touchCommit(nextSeq())

        activateFinger(0, x, y, pressure)

        if (fakePinch) {
          activateFinger(1, -e.pageX + screen.bounds.x + screen.bounds.w,
            -e.pageY + screen.bounds.y + screen.bounds.h, pressure)
        }

        element.bind('mousemove', mouseMoveListener)
        $document.bind('mouseup', mouseUpListener)
        $document.bind('mouseleave', mouseUpListener)
      }

      function mouseMoveListener(e) {
        if (e.originalEvent) {
          e = e.originalEvent
        }

        // Skip secondary click
        if (e.which === 3) {
          return
        }
        e.preventDefault()

        var addGhostFinger = !fakePinch && e.altKey
        var deleteGhostFinger = fakePinch && !e.altKey

        fakePinch = e.altKey

        var x = e.pageX - screen.bounds.x
          , y = e.pageY - screen.bounds.y
          , pressure = 0.5
          , scaled = screen.scaler.coords(
              screen.bounds.w
            , screen.bounds.h
            , x
            , y
            , screen.rotation
            )

        control.touchMove(nextSeq(), 0, scaled.xP, scaled.yP, pressure)

        if (addGhostFinger) {
          control.touchDown(nextSeq(), 1, 1 - scaled.xP, 1 - scaled.yP, pressure)
        }
        else if (deleteGhostFinger) {
          control.touchUp(nextSeq(), 1)
        }
        else if (fakePinch) {
          control.touchMove(nextSeq(), 1, 1 - scaled.xP, 1 - scaled.yP, pressure)
        }

        control.touchCommit(nextSeq())

        activateFinger(0, x, y, pressure)

        if (deleteGhostFinger) {
          deactivateFinger(1)
        }
        else if (fakePinch) {
          activateFinger(1, -e.pageX + screen.bounds.x + screen.bounds.w,
            -e.pageY + screen.bounds.y + screen.bounds.h, pressure)
        }
      }

      function mouseUpListener(e) {
        if (e.originalEvent) {
          e = e.originalEvent
        }

        // Skip secondary click
        if (e.which === 3) {
          return
        }
        e.preventDefault()

        control.touchUp(nextSeq(), 0)

        if (fakePinch) {
          control.touchUp(nextSeq(), 1)
        }

        control.touchCommit(nextSeq())

        deactivateFinger(0)

        if (fakePinch) {
          deactivateFinger(1)
        }

        stopMousing()
      }

      function startMousing() {
        input[0].focus()
        control.gestureStart(nextSeq())
      }

      function stopMousing() {
        element.unbind('mousemove', mouseMoveListener)
        $document.unbind('mouseup', mouseUpListener)
        $document.unbind('mouseleave', mouseUpListener)
        deactivateFingers()
        control.gestureStop(nextSeq())
      }

      function touchStartListener(e) {
        e.preventDefault()

        //Make it jQuery compatible also
        if (e.originalEvent) {
          e = e.originalEvent
        }

        calculateBounds()

        if (e.touches.length === e.changedTouches.length) {
          startTouching()
        }

        var currentTouches = Object.create(null)
        var i, l

        for (i = 0, l = e.touches.length; i < l; ++i) {
          currentTouches[e.touches[i].identifier] = 1;
        }

        function maybeLostTouchEnd(id) {
          return !(id in currentTouches)
        }

        // We might have lost a touchend event due to various edge cases
        // (literally) such as dragging from the bottom of the screen so that
        // the control center appears. If so, let's ask for a reset.
        if (Object.keys(slotted).some(maybeLostTouchEnd)) {
          Object.keys(slotted).forEach(function(id) {
            slots.push(slotted[id])
            delete slotted[id]
          })
          slots.sort().reverse()
          control.touchReset(nextSeq())
          deactivateFingers()
        }

        if (!slots.length) {
          // This should never happen but who knows...
          throw new Error('Ran out of multitouch slots')
        }

        for (i = 0, l = e.changedTouches.length; i < l; ++i) {
          var touch = e.changedTouches[i]
            , slot = slots.pop()
            , x = touch.pageX - screen.bounds.x
            , y = touch.pageY - screen.bounds.y
            , pressure = touch.force || 0.5
            , scaled = screen.scaler.coords(
                screen.bounds.w
              , screen.bounds.h
              , x
              , y
              , screen.rotation
              )

          slotted[touch.identifier] = slot
          control.touchDown(nextSeq(), slot, scaled.xP, scaled.yP, pressure)
          activateFinger(slot, x, y, pressure)
        }

        element.bind('touchmove', touchMoveListener)
        $document.bind('touchend', touchEndListener)
        $document.bind('touchleave', touchEndListener)

        control.touchCommit(nextSeq())
      }

      function touchMoveListener(e) {
        e.preventDefault()

        if (e.originalEvent) {
          e = e.originalEvent
        }

        for (var i = 0, l = e.changedTouches.length; i < l; ++i) {
          var touch = e.changedTouches[i]
            , slot = slotted[touch.identifier]
            , x = touch.pageX - screen.bounds.x
            , y = touch.pageY - screen.bounds.y
            , pressure = touch.force || 0.5
            , scaled = screen.scaler.coords(
                screen.bounds.w
              , screen.bounds.h
              , x
              , y
              , screen.rotation
              )

          control.touchMove(nextSeq(), slot, scaled.xP, scaled.yP, pressure)
          activateFinger(slot, x, y, pressure)
        }

        control.touchCommit(nextSeq())
      }

      function touchEndListener(e) {
        if (e.originalEvent) {
          e = e.originalEvent
        }

        var foundAny = false

        for (var i = 0, l = e.changedTouches.length; i < l; ++i) {
          var touch = e.changedTouches[i]
            , slot = slotted[touch.identifier]
          if (slot === void 0) {
            // We've already disposed of the contact. We may have gotten a
            // touchend event for the same contact twice.
            continue
          }
          delete slotted[touch.identifier]
          slots.push(slot)
          control.touchUp(nextSeq(), slot)
          deactivateFinger(slot)
          foundAny = true
        }

        if (foundAny) {
          control.touchCommit(nextSeq())
          if (!e.touches.length) {
            stopTouching()
          }
        }
      }

      function startTouching() {
        control.gestureStart(nextSeq())
      }

      function stopTouching() {
        element.unbind('touchmove', touchMoveListener)
        $document.unbind('touchend', touchEndListener)
        $document.unbind('touchleave', touchEndListener)
        deactivateFingers()
        control.gestureStop(nextSeq())
      }

      element.on('touchstart', touchStartListener)
      element.on('mousedown', mouseDownListener)

      createSlots()
    }
  }
}
