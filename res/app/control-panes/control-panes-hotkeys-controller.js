module.exports =
  function($scope, gettext, $location, $rootScope, ScopedHotkeysService,
    $window) {

    $scope.remotePaneSize = '30% + 2px'

    var actions = {
      previousDevice: function() {
        // console.log('prev')
      },
      nextDevice: function() {
        // console.log('next')
      },
      deviceList: function() {
        $location.path('/devices/')
      },
      switchCharset: function() {
        $scope.control.keyPress('switch_charset')
      },
      // TODO: Refactor this
      rotateLeft: function() {
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

        if ($rootScope.standalone) {
          $window.resizeTo($window.outerHeight, $window.outerWidth)
        }

      },
      rotateRight: function() {
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

        if ($rootScope.standalone) {
          $window.resizeTo($window.outerHeight, $window.outerWidth)
        }
      },
      focusUrlBar: function() {
        // TODO: Switch tab and focus
        // console.log('focus')
      },
      takeScreenShot: function() {
        // TODO: Switch tab and take screenshot
        //$scope.takeScreenShot()
      },
      pressMenu: function() {
        $scope.control.menu()
      },
      pressHome: function() {
        $scope.control.home()
      },
      pressBack: function() {
        $scope.control.back()
      },
      toggleDevice: function() {
        // $scope.controlScreen.show = !$scope.controlScreen.show
      },
      togglePlatform: function() {
        if ($rootScope.platform === 'web') {
          $rootScope.platform = 'native'
        } else {
          $rootScope.platform = 'web'
        }
      },
      scale: function() {
        // TODO: scale size
      }
    }

    ScopedHotkeysService($scope, [
      // ['shift+up', gettext('Previous Device'), actions.previousDevice],
      // ['shift+down', gettext('Next Device'), actions.nextDevice],
      ['command+shift+d', gettext('Go to Device List'), actions.deviceList],

      ['shift+space', gettext('Selects Next IME'), actions.switchCharset],
      ['command+left', gettext('Rotate Left'), actions.rotateLeft],
      ['command+right', gettext('Rotate Right'), actions.rotateRight],

      // ['command+1', gettext('Scale 100%'), actions.scale],
      // ['command+2', gettext('Scale 75%'), actions.scale],
      // ['command+3', gettext('Scale 50%'), actions.scale],

      // ['shift+l', gettext('Focus URL bar'), actions.focusUrlBar],
      // ['shift+s', gettext('Take Screenshot'), actions.takeScreenShot],

      ['command+shift+m', gettext('Press Menu button'), actions.pressMenu],
      ['command+shift+h', gettext('Press Home button'), actions.pressHome],
      ['command+shift+b', gettext('Press Back button'), actions.pressBack],

      // ['shift+i', gettext('Show/Hide device'), actions.toggleDevice],
      ['shift+w', gettext('Toggle Web/Native'), actions.togglePlatform, false]
    ])
  }
