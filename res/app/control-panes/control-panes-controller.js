module.exports = function ControlPanesCtrl($scope, gettext) {

  var sharedTabs = [
    {
      title: gettext('OneShared'),
      icon: 'fa-laptop',
      templateUrl: 'settings/notifications/notifications.jade',
      filters: ['web']
    },
    {
      title: gettext('TwoShared'),
      icon: 'fa-pencil',
      templateUrl: 'settings/local/local-settings.jade',
      filters: ['native', 'web']
    }
  ]

  $scope.topTabs = [
    {
      title: gettext('1stTop'),
      icon: 'fa-laptop',
      templateUrl: 'settings/notifications/notifications.jade',
      filters: ['native', 'web']
    }
  ].concat(angular.copy(sharedTabs))

  $scope.belowTabs = [
    {
      title: gettext('1stBelow'),
      icon: 'fa-pencil',
      templateUrl: 'settings/local/local-settings.jade',
      filters: ['native', 'web']
    },
    {
      title: gettext('2ndBelow'),
      icon: 'fa-rocket',
      templateUrl: 'settings/language/language.jade',
      filters: ['native']
    }
  ].concat(angular.copy(sharedTabs))


}
