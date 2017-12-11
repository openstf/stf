module.exports =
  function AvdEmulatorCtrl($scope, $http, UserService) {
    $scope.adbKeys = []
    $scope.androidEmulators = []
    $scope.active = true
    $scope.notification = false

    function refreshEmulatorList() {
      if ($scope.androidEmulators.length === 0) {
        UserService.getEmulatorList()
        $scope.androidEmulators = UserService.getAndroidEmulators()
      }
    }

    $scope.saveStartEmulatorArgs = function(serial, avdCmd) {
      if (avdCmd.indexOf('-port') === -1) {
        UserService.updateEmulatorStartArgs(serial, avdCmd)
      } else {
        for(var emuId = 0; emuId < $scope.androidEmulators[0].length; emuId++) {
          if ($scope.androidEmulators[0][emuId].serial === serial) {
            $scope.androidEmulators[0][emuId].notification = {
              'text': 'Please remove :  -port  options from cmd line'
            }
            $scope.notification = false
          }
        }
      }
    }

    $scope.RestartEmulator = function(emuName, serial, avdCmd) {
      UserService.restartAVDEmulator(emuName, serial, avdCmd)
    }

    $scope.$on('emulator.list.collected', refreshEmulatorList)

    $scope.$on('emulator.restart.unavailable', function(data, output) {
      if (typeof $scope.androidEmulators !== 'undefined') {
        for (var emuId = 0; emuId < $scope.androidEmulators[0].length; emuId++) {
          if ($scope.androidEmulators[0][emuId].serial === output.deviceSerial) {
            $scope.androidEmulators[0][emuId].notification = {
              'text': 'Warning : \n Device is used by someone else. Cannot restart it.'
              }
            $scope.notification = false
          }
        }
      }
    })

    $scope.$on('emulator.startargs.updated', function(data, output) {
      if (typeof $scope.androidEmulators !== 'undefined') {
        for (var emuId = 0; emuId < $scope.androidEmulators[0].length; emuId++) {
          if ($scope.androidEmulators[0][emuId].serial === output.deviceSerial) {
            $scope.androidEmulators[0][emuId].notification = {
              'text': 'Emulator starting arguments were updated to :  ' + output.args
            }
            $scope.notification = false
          }
        }
      }
    })

      $scope.$on('emulator.startingArgs.updated.and.restarted', function(data, output) {
        if (typeof $scope.androidEmulators !== 'undefined') {
          for (var emuId = 0; emuId < $scope.androidEmulators[0].length; emuId++) {
            if ($scope.androidEmulators[0][emuId].serial === output.deviceSerial) {
              $scope.androidEmulators[0][emuId].notification = {
                'text': 'Emulator was started/restarted with updated arguments :  ' +
                        output.userData
              }
              $scope.notification = false
            }
          }
        }
      })

    refreshEmulatorList()
  }
