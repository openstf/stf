module.exports = function SettingsCtrl($scope, gettext) {

  $scope.settingTabs = [
    {
      title: gettext('General'),
      icon: 'fa-gears fa-fw',
      templateUrl: 'settings/general/general.jade'
    },
    {
      title: gettext('ADB Keys'),
      icon: 'fa-key fa-fw',
      templateUrl: 'settings/adb-keys/adb-keys.jade'
    }
  ]
}
