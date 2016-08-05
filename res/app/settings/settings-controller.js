module.exports = function SettingsCtrl($scope, gettext) {

  $scope.settingTabs = [
    {
      title: gettext('General'),
      icon: 'fa-gears fa-fw',
      templateUrl: 'settings/general/general.pug'
    },
    {
      title: gettext('Keys'),
      icon: 'fa-key fa-fw',
      templateUrl: 'settings/keys/keys.pug'
    }
  ]
}
