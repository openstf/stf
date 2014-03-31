module.exports = function ($scope, gettext, $rootScope, $routeParams, $location,
                           DeviceService, GroupService, ControlService) {

  var sharedTabs = [
    {
      title: gettext('Screenshots'),
      icon: 'fa-camera',
      templateUrl: 'control-panes/screenshots/screenshots.jade',
      filters: ['native', 'web']
    },
    {
      title: gettext('Inspect'),
      icon: 'fa-pencil',
      templateUrl: 'control-panes/inspect/inspect.jade',
      filters: ['web']
    },
    {
      title: gettext('Resources'),
      icon: 'fa-globe',
      templateUrl: 'control-panes/resources/resources.jade',
      filters: ['web']
    },
    {
      title: gettext('CPU'),
      icon: 'fa-bar-chart-o',
      templateUrl: 'control-panes/cpu/cpu.jade',
      filters: ['native', 'web']
    },
    {
      title: gettext('Advanced'),
      icon: 'fa-bolt',
      templateUrl: 'control-panes/advanced/advanced.jade',
      filters: ['native', 'web']
    }
  ]

  $scope.topTabs = [
    {
      title: gettext('Dashboard'),
      icon: 'fa-dashboard fa-fw',
      templateUrl: 'control-panes/dashboard/dashboard.jade',
      filters: ['native', 'web']
    }
  ].concat(angular.copy(sharedTabs))

  $scope.belowTabs = [
    {
      title: gettext('Logs'),
      icon: 'fa-list-alt',
      templateUrl: 'control-panes/logs/logs.jade',
      filters: ['native', 'web']
    }
  ].concat(angular.copy(sharedTabs))


  $rootScope.device = null
  $rootScope.control = null


  DeviceService.get($routeParams.serial, $rootScope)
    .then(function (device) {
      return GroupService.invite(device)
    })
    .then(function (device) {
      $rootScope.device = device
      $rootScope.control = ControlService.create(device, device.channel)
      return device
    })
    .catch(function () {
      $location.path('/')
    })
}
