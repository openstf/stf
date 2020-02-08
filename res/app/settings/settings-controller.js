/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = function SettingsCtrl($scope, gettext, AppState) {

  $scope.settingTabs = []
  $scope.settingTabs.push(
    {
      title: gettext('General'),
      icon: 'fa-gears fa-fw',
      templateUrl: 'settings/general/general.pug'
    }
  )
  $scope.settingTabs.push(
    {
      title: gettext('Keys'),
      icon: 'fa-key fa-fw',
      templateUrl: 'settings/keys/keys.pug'
    }
  )
  $scope.settingTabs.push(
    {
      title: gettext('Groups'),
      icon: 'fa-object-group fa-fw',
      templateUrl: 'settings/groups/groups.pug'
    }
  )
  if (AppState.user.privilege === 'admin') {
    $scope.settingTabs.push(
      {
        title: gettext('Devices'),
        icon: 'fa-mobile stf-settings-tabs-device-icon fa-fw',
        templateUrl: 'settings/devices/devices.pug'
      }
    )
    $scope.settingTabs.push(
      {
        title: gettext('Users'),
        icon: 'fa-user fa-fw',
        templateUrl: 'settings/users/users.pug'
      }
    )
  }
}
