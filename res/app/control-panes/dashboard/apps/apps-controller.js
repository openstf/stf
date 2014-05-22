// See https://github.com/android/platform_packages_apps_settings/blob/master/AndroidManifest.xml

module.exports = function ShellCtrl($scope, gettext) {
  $scope.result = null

  var run = function (command) {
    // Force run activity
    command += ' --activity-clear-top'
    return $scope.control.shell(command)
      .then(function (result) {
        console.log(result)
      })
  }

  function openSetting(activity) {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.Settings\$' + activity)
  }

  $scope.openSettings = function () {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.Settings')
  }

  $scope.openWiFiSettings = function () {
    //openSetting('WifiSettingsActivity')
    run('am start -a android.settings.WIFI_SETTINGS')
  }

  $scope.openLocaleSettings = function () {
    openSetting('LocalePickerActivity')
  }

  $scope.openIMESettings = function () {
    openSetting('KeyboardLayoutPickerActivity')
  }

  $scope.openDisplaySettings = function () {
    openSetting('DisplaySettingsActivity')
  }

  $scope.openDeviceInfo = function () {
    openSetting('DeviceInfoSettingsActivity')
  }

  $scope.openManageApps = function () {
    //openSetting('ManageApplicationsActivity')
    run('am start -a android.settings.APPLICATION_SETTINGS')
  }

  $scope.openRunningApps = function () {
    openSetting('RunningServicesActivity')
  }

  $scope.openDeveloperSettings = function () {
    openSetting('DevelopmentSettingsActivity')
  }


  //'am start -n com.android.settings/.Settings\$PowerUsageSummaryActivity'
  //'am start -a android.intent.action.POWER_USAGE_SUMMARY'


  $scope.clear = function () {
    $scope.command = ''
    $scope.data = ''
    $scope.result = null
  }
}
