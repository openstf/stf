module.exports = function ShellCtrl($scope) {
  $scope.result = null

  $scope.run = function(command) {
    if (command === 'clear') {
      $scope.clear()
      return
    }

    $scope.command = ''

    return $scope.control.shell(command)
      .progressed(function(result) {
        $scope.result = result
        $scope.data = result.data.join('')
        $scope.$digest()
      })
      .then(function(result) {
        $scope.result = result
        $scope.data = result.data.join('')
        $scope.$digest()
      })
  }

  // WANDERA CUSTOM - START
  $scope.runIntent = function(string) {
    $scope.run('am start -d \"' + string + '\"')
  }

  $scope.runPmListPackages = function(grep) {
    $scope.run('pm list packages | grep ' + grep)
  }

  $scope.clearDevice = function() {
    $scope.data = 'Resetting Wandera Dev...'
    $scope.control.shell('am start -W -a android.intent.action.VIEW -d ' +
      "'wandera://?action=reset' com.wandera.android.dev")
    $scope.data = 'Deauthing Wandera Dev...'
    $scope.control.shell('am start -W -a android.intent.action.VIEW -d ' +
      "'wandera://?action=deauthorize' com.wandera.android.dev")
    $scope.data = 'Uninstalling Wandera Dev...'
    $scope.control.shell('pm uninstall com.wandera.android.dev')
    $scope.data = 'Cleaning Wandera Debug...'
    $scope.control.shell('am start -W -a android.intent.action.VIEW -d ' +
      "'wandera://?action=reset' com.wandera.android.debug")
    $scope.control.shell('am start -W -a android.intent.action.VIEW -d ' +
      "'wandera://?action=deauthorize' com.wandera.android.debug")
    $scope.control.shell('pm uninstall com.wandera.android.debug')
    $scope.data = 'Cleaning Wandera Prod...'
    $scope.control.shell('am start -W -a android.intent.action.VIEW -d' +
      " 'wandera://?action=reset' com.wandera.android")
    $scope.control.shell('am start -W -a android.intent.action.VIEW -d' +
      " 'wandera://?action=deauthorize' com.wandera.android")
    $scope.control.shell('pm uninstall com.wandera.android')
    $scope.data = 'Cleaned'
    $scope.$digest()
  }

  $scope.disableAnimations = function() {
    $scope.control.shell('settings put global window_animation_scale 0')
    $scope.control.shell('settings put global transition_animation_scale 0')
    $scope.control.shell('settings put global animator_duration_scale 0')
    $scope.$digest()
  }

  $scope.enableAnimations = function() {
    $scope.control.shell('settings put global window_animation_scale 1')
    $scope.control.shell('settings put global transition_animation_scale 1')
    $scope.control.shell('settings put global animator_duration_scale 1')
    $scope.$digest()
  }
  // WANDERA CUSTOM - END

  $scope.clear = function() {
    $scope.command = ''
    $scope.data = ''
    $scope.result = null
  }
}
