module.exports = function ControlPanesCtrl($scope, gettext) {

  var sharedTabs = [
    {
      title: gettext('Screenshots'),
      icon: 'fa-camera',
      templateUrl: 'settings/notifications/notifications.jade',
      filters: ['native', 'web']
    },
    {
      title: gettext('Inspect'),
      icon: 'fa-pencil',
      templateUrl: 'settings/notifications/notifications.jade',
      filters: ['web']
    },
    {
      title: gettext('Resources'),
      icon: 'fa-globe',
      templateUrl: 'settings/notifications/notifications.jade',
      filters: ['web']
    },
    {
      title: gettext('CPU'),
      icon: 'fa-bar-chart-o',
      templateUrl: 'settings/notifications/notifications.jade',
      filters: ['native', 'web']
    },
    {
      title: gettext('Advanced'),
      icon: 'fa-bolt',
      templateUrl: 'settings/notifications/notifications.jade',
      filters: ['native', 'web']
    }
  ]

  $scope.topTabs = [
    {
      title: gettext('Dashboard'),
      icon: 'fa-dashboard fa-fw',
      templateUrl: 'settings/notifications/notifications.jade',
      filters: ['native', 'web']
    }
  ].concat(angular.copy(sharedTabs))

  $scope.belowTabs = [
    {
      title: gettext('Logs'),
      icon: 'fa-list-alt',
      templateUrl: 'settings/local/local-settings.jade',
      filters: ['native', 'web']
    }
  ].concat(angular.copy(sharedTabs))


}
