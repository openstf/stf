module.exports = function ($scope, hotkeys, $filter, gettext, $location) {

  var actions = {
    previousDevice: function () {
      console.log('prev')
    },
    nextDevice: function () {
      console.log('next')
    },
    deviceList: function () {
      $location.path('/devices/')
    },
    switchCharset: function () {
      $scope.control.keyPress('switch_charset')
    },
    rotateScreen: function () {
      // TODO: Add a toggle rotate
      $scope.control.rotate(90)
    },
    focusUrlBar: function () {
      // TODO: Switch tab and focus
      console.log('focus')
    },
    takeScreenShot: function () {
      // TODO: Switch tab and take screenshot
      $scope.takeScreenShot()
    },
    pressMenu: function () {
      $scope.control.menu()
    },
    pressHome: function () {
      $scope.control.home()
    },
    pressBack: function () {
      $scope.control.back()
    },
    toggleDevice: function () {
      $scope.showScreen = false
    },
    togglePlatform: function () {
      console.log('platform')
    }
  }

  var hotkeySet = [
    ['shift+left', gettext('Previous device'), actions.previousDevice],
    ['shift+right', gettext('Next device'), actions.nextDevice],
    ['shift+d', gettext('Go to Device List'), actions.deviceList],

    ['shift+space', gettext('Selects next IME'), actions.switchCharset],
    ['shift+r', gettext('Rotate screen'), actions.rotateScreen],

    ['shift+l', gettext('Focus URL bar'), actions.focusUrlBar],
    ['shift+s', gettext('Take screenshot'), actions.takeScreenShot],

    ['shift+m', gettext('Press Menu button'), actions.pressMenu],
    ['shift+h', gettext('Press Home button'), actions.pressHome],
    ['shift+b', gettext('Press Back button'), actions.pressBack],

    ['shift+i', gettext('Show/Hide device'), actions.toggleDevice],
    ['shift+w', gettext('Toggle Web/Native'), actions.togglePlatform]
  ]

  function hotkeyAdd(combo, desc, cb) {
    hotkeys.add({
      combo: combo,
      description: $filter('translate')(desc),
      allowIn: ['textarea'],
      callback: function (event) {
        //event.preventDefault()
        cb()
      }
    })
  }

  angular.forEach(hotkeySet, function (value) {
    hotkeyAdd(value[0], value[1], value[2])
  })

  $scope.$on('$destroy', function () {
    angular.forEach(hotkeySet, function (value) {
      hotkeys.del(value[0])
    })
  })
}
