module.exports = function DeviceControlKeyDirective() {
  return {
    restrict: 'A'
  , link: function(scope, element, attrs) {
      var key = attrs.deviceControlKey

      function up() {
        scope.control.keyUp(key)
      }

      function down() {
        scope.control.keyDown(key)
      }

      function touchUp(e) {
        if (e.touches.length === 0) {
          element.unbind('touchleave', touchUp)
          element.unbind('touchend', touchUp)
          up()
        }
      }

      function mouseUp() {
        element.unbind('mouseup', mouseUp)
        element.unbind('mouseleave', mouseUp)
        up()
      }

      element.bind('touchstart', function(e) {
        e.preventDefault()
        if (e.touches.length === e.changedTouches.length) {
          element.bind('touchleave', touchUp)
          element.bind('touchend', touchUp)
          down()
        }
      })

      element.bind('mousedown', function(e) {
        e.preventDefault()
        element.bind('mouseup', mouseUp)
        element.bind('mouseleave', mouseUp)
        down()
      })
    }
  }
}
