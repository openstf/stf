module.exports =
  function ($scope, gettext, $location, $rootScope, ScopedHotkeysService) {

    var actions = {
      previousDevice: function () {
        console.log('prev')
      },
      nextDevice: function () {
        console.log('next')
//        console.log('$scope.groupTracker.devices', $scope.groupTracker.devices)
        //console.log('$scope.groupTracker.devices', $scope.groupDevices)

        //groupDevice in $scope.groupTracker.devices
        //groupDevice.serial === device.serial
        //$location.path('/control/' + device.serial)
      },
      deviceList: function () {
        $location.path('/devices/')
      },
      switchCharset: function () {
        $scope.control.keyPress('switch_charset')
      },
      rotateLeft: function () {
        var angle = 0
        if ($scope.device && $scope.device.display) {
          angle = $scope.device.display.rotation
        }
        if (angle === 0) {
          angle = 270
        } else {
          angle -= 90
        }
        $scope.control.rotate(angle)
      },
      rotateRight: function () {
        var angle = 0
        if ($scope.device && $scope.device.display) {
          angle = $scope.device.display.rotation
        }
        if (angle === 270) {
          angle = 0
        } else {
          angle += 90
        }
        $scope.control.rotate(angle)
      },
      focusUrlBar: function () {
        // TODO: Switch tab and focus
        console.log('focus')
      },
      takeScreenShot: function () {
        // TODO: Switch tab and take screenshot
        //$scope.takeScreenShot()
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
        //$scope.controlScreen.show = !$scope.controlScreen.show
      },
      togglePlatform: function () {
        if ($rootScope.platform === 'web') {
          $rootScope.platform = 'native'
        } else {
          $rootScope.platform = 'web'
        }
      }
    }

    ScopedHotkeysService($scope, [
      ['shift+up', gettext('Previous Device'), actions.previousDevice],
      ['shift+down', gettext('Next Device'), actions.nextDevice],
      ['shift+d', gettext('Go to Device List'), actions.deviceList],

      ['shift+space', gettext('Selects Next IME'), actions.switchCharset],
      ['command+left', gettext('Rotate Left'), actions.rotateLeft],
      ['command+right', gettext('Rotate Right'), actions.rotateRight],

      ['shift+l', gettext('Focus URL bar'), actions.focusUrlBar],
      ['shift+s', gettext('Take Screenshot'), actions.takeScreenShot],

      ['shift+m', gettext('Press Menu button'), actions.pressMenu],
      ['shift+h', gettext('Press Home button'), actions.pressHome],
      ['shift+b', gettext('Press Back button'), actions.pressBack],

      ['shift+i', gettext('Show/Hide device'), actions.toggleDevice],
      ['shift+w', gettext('Toggle Web/Native'), actions.togglePlatform]
    ])
//
//    var hotkeySet = [
//      ['shift+up', gettext('Previous Device'), actions.previousDevice],
//      ['shift+down', gettext('Next Device'), actions.nextDevice],
//      ['shift+d', gettext('Go to Device List'), actions.deviceList],
//
//      ['shift+space', gettext('Selects Next IME'), actions.switchCharset],
//      ['command+left', gettext('Rotate Left'), actions.rotateLeft],
//      ['command+right', gettext('Rotate Right'), actions.rotateRight],
//
//      ['shift+l', gettext('Focus URL bar'), actions.focusUrlBar],
//      ['shift+s', gettext('Take Screenshot'), actions.takeScreenShot],
//
//      ['shift+m', gettext('Press Menu button'), actions.pressMenu],
//      ['shift+h', gettext('Press Home button'), actions.pressHome],
//      ['shift+b', gettext('Press Back button'), actions.pressBack],
//
//      ['shift+i', gettext('Show/Hide device'), actions.toggleDevice],
//      ['shift+w', gettext('Toggle Web/Native'), actions.togglePlatform]
//    ]
//
//    function hotkeyAdd(combo, desc, cb) {
//      hotkeys.add({
//        combo: combo,
//        description: $filter('translate')(desc),
//        allowIn: ['textarea'],
//        callback: function (event) {
//          event.preventDefault()
//          cb()
//        }
//      })
//    }
//
//    angular.forEach(hotkeySet, function (value) {
//      hotkeyAdd(value[0], value[1], value[2])
//    })
//
//    $scope.$on('$destroy', function () {
//      angular.forEach(hotkeySet, function (value) {
//        hotkeys.del(value[0])
//      })
//    })
  }
