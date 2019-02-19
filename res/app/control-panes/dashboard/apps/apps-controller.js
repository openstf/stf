// See https://github.com/android/platform_packages_apps_settings/blob/master/AndroidManifest.xml

module.exports = function ShellCtrl($scope) {
  $scope.result = null

  var run = function(cmd) {
    var command = cmd
    // Force run activity
    command += ' --activity-clear-top'
    return $scope.control.shell(command)
      .then(function(result) {
        // console.log(result)
      })
  }

  // TODO: Move this to server side
  // TODO: Android 2.x doesn't support openSetting(), account for that on the UI

  function openSetting(activity) {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.Settings\\$' +
    activity)
  }

  $scope.openSettings = function() {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.Settings')
  }

  $scope.openWiFiSettings = function() {
    //openSetting('WifiSettingsActivity')
    run('am start -a android.settings.WIFI_SETTINGS')
  }

  // WANDERA CUSTOM - START
  $scope.openSettingActivity = function(activity) {
    openSetting(activity)
  }

  $scope.openWandera = function() {
    run('am start com.wandera.android')
  }


  $scope.openWanderaDev = function() {
    run('am start com.wandera.android.dev')
  }

  $scope.openWanderaDebug = function() {
    run('am start com.wandera.android.debug')
  }

  $scope.openGMail = function() {
    run('am start com.google.android.gm')
  }

  $scope.openChrome = function() {
    run('am start -n com.android.chrome/com.google.android.apps.chrome.Main')
  }

  $scope.openBeta = function() {
    run('am start io.crash.air/.ui.MainActivity')
  }

  $scope.openAgent = function() {
    run('am start com.airwatch.androidagent/com.airwatch.agent.ui.activity.SplashActivity')
  }
  // WANDERA CUSTOM - END

  $scope.openLocaleSettings = function() {
    openSetting('LocalePickerActivity')
  }

  $scope.openIMESettings = function() {
    openSetting('KeyboardLayoutPickerActivity')
  }

  $scope.openDisplaySettings = function() {
    openSetting('DisplaySettingsActivity')
  }

  $scope.openDeviceInfo = function() {
    openSetting('DeviceInfoSettingsActivity')
  }

  $scope.openManageApps = function() {
    //openSetting('ManageApplicationsActivity')
    run('am start -a android.settings.APPLICATION_SETTINGS')
  }

  $scope.openRunningApps = function() {
    openSetting('RunningServicesActivity')
  }

  $scope.openDeveloperSettings = function() {
    openSetting('DevelopmentSettingsActivity')
  }

  $scope.clear = function() {
    $scope.command = ''
    $scope.data = ''
    $scope.result = null
  }
}
