module.exports =
  function AvdEmulatorCtrl($scope, $http, UserService) {
    $scope.adbKeys = []
    $scope.androidEmulators = []
    $scope.active = true
    $scope.notification = false

    function refreshEmulatorList() {
      if ($scope.androidEmulators.length === 0 ) {
        UserService.getEmulatorList()
        $scope.androidEmulators = UserService.getAndroidEmulators()
      }
    }

    $scope.saveStartEmulatorArgs = function(serial, avd_cmd) {
      if (avd_cmd.indexOf('-port') === -1) {
        UserService.updateEmulatorStartArgs(serial, avd_cmd)
      } else {
        for(var emu_id = 0; emu_id < $scope.androidEmulators[0].length; emu_id++ ){
        if ($scope.androidEmulators[0][emu_id].serial === output.deviceSerial) {
          $scope.androidEmulators[0][emu_id]['notification'] = {
            'text':'Please remove :  -port  options from cmd line'
          }
          $scope.notification = false
        }
      }}
    }

    $scope.RestartEmulator = function(emulator_name, serial, avd_cmd) {
      UserService.restartAVDEmulator(emulator_name, serial, avd_cmd)
    }

    $scope.$on('emulator.list.collected', refreshEmulatorList)

    $scope.$on('emulator.restart.unavailable', function(data , output){
      if (typeof($scope.androidEmulators) !== 'undefined' ) {
      for(var emu_id = 0; emu_id < $scope.androidEmulators[0].length; emu_id++ ){
        if ($scope.androidEmulators[0][emu_id].serial === output.deviceSerial) {
          $scope.androidEmulators[0][emu_id]['notification'] = {
            'text':'Warning : \n Device is used by someone else. Cannot restart it.'
            }
          $scope.notification = false
        }
      }}
      })

    $scope.$on('emulator.startargs.updated', function(data, output){
      if (typeof($scope.androidEmulators) !== 'undefined' ) {
      for(var emu_id = 0; emu_id < $scope.androidEmulators[0].length; emu_id++ ){
        if ($scope.androidEmulators[0][emu_id].serial === output.deviceSerial) {
          $scope.androidEmulators[0][emu_id]['notification'] = {
            'text':'Emulator starting arguments were updated to :  ' + output.args
          }
          $scope.notification = false
        }
      }}
      })

      $scope.$on('emulator.startingArgs.updated.and.restarted', function(data, output){
      if (typeof($scope.androidEmulators) !== 'undefined' ) {
      for(var emu_id = 0; emu_id < $scope.androidEmulators[0].length; emu_id++ ){
        if ($scope.androidEmulators[0][emu_id].serial === output.deviceSerial) {
          $scope.androidEmulators[0][emu_id]['notification'] = {
            'text':'Emulator was started/restarted with updated arguments :  ' + output.userData
            }
          $scope.notification = false
        }
      }}
      })

    refreshEmulatorList()
  }
