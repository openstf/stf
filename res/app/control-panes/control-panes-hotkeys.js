module.exports = function ($scope, hotkeys, $filter, gettext) {

  function hotkeyAdd(combo, desc, cb) {
    hotkeys.add({
      combo: combo,
      description: $filter('translate')(desc),
      allowIn: ['textarea'],
      callback: function (event) {
        event.preventDefault()
        cb()
      }
    })
  }

  var actions = {
    switchCharset: function () {
      $scope.control.keyPress('switch_charset')
    },
    rotateScreen: function () {
      // TODO: Add a proper rotate
      $scope.control.rotate(90)
    },
    focusUrlBar: function () {
      console.log('action')
    },
    takeScreenShot: function () {
      console.log('action')
    }

  }

  hotkeyAdd('shift+left', gettext('Previous device'), actions.takeScreenShot)
  hotkeyAdd('shift+right', gettext('Next device'), actions.takeScreenShot)
  hotkeyAdd('shift+D', gettext('Go to Device List'), actions.takeScreenShot)

  hotkeyAdd('shift+SPACE', gettext('Selects next IME in the device'), actions.switchCharset)
  hotkeyAdd('shift+R', gettext('Rotate screen'), actions.rotateScreen)

  hotkeyAdd('shift+L', gettext('Focus URL bar'), actions.focusUrlBar)
  hotkeyAdd('shift+S', gettext('Take screenshot'), actions.takeScreenShot)

  hotkeyAdd('shift+M', gettext('Press Menu button'), actions.takeScreenShot)
  hotkeyAdd('shift+H', gettext('Press Home button'), actions.takeScreenShot)
  hotkeyAdd('shift+B', gettext('Press Back button'), actions.takeScreenShot)

  hotkeyAdd('shift+I', gettext('Show/Hide device'), actions.takeScreenShot)

  hotkeyAdd('shift+W', gettext('Toggle Web/Native'), actions.takeScreenShot)



}
