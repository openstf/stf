module.exports =
  function ControlPanesController($scope, $http, gettext, $routeParams,
    $timeout, $location, DeviceService, GroupService, ControlService,
    StorageService, FatalMessageService, SettingsService) {

    var sharedTabs = [
      {
        title: gettext('Screenshots'),
        icon: 'fa-camera',
        templateUrl: 'control-panes/screenshots/screenshots.jade',
        filters: ['native', 'web']
      },
//    {
//      title: gettext('Inspect'),
//      icon: 'fa-pencil',
//      templateUrl: 'control-panes/inspect/inspect.jade',
//      filters: ['web']
//    },
//    {
//      title: gettext('Resources'),
//      icon: 'fa-globe',
//      templateUrl: 'control-panes/resources/resources.jade',
//      filters: ['web']
//    },
//    {
//      title: gettext('CPU'),
//      icon: 'fa-bar-chart-o',
//      templateUrl: 'control-panes/cpu/cpu.jade',
//      filters: ['native', 'web']
//    },
      {
        title: gettext('Automation'),
        icon: 'fa-road',
        templateUrl: 'control-panes/automation/automation.jade',
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
    ].concat(angular.copy(sharedTabs), [
        {
          title: gettext('Info'),
          icon: 'fa-info',
          templateUrl: 'control-panes/info/info.jade',
          filters: ['native', 'web']
        }
      ])


    $scope.belowTabs = [
//    {
//      title: gettext('Activity'),
//      icon: 'fa-clock-o',
//      templateUrl: 'control-panes/activity/activity.jade',
//      filters: ['native', 'web']
//    },
      {
        title: gettext('Logs'),
        icon: 'fa-list-alt',
        templateUrl: 'control-panes/logs/logs.jade',
        filters: ['native', 'web']
      }
    ].concat(angular.copy(sharedTabs))

    $scope.device = null
    $scope.control = null

    // TODO: Move this out to Ctrl.resolve
    // http://blog.brunoscopelliti.com/show-route-only-after-all-promises-are-resolved
    // http://odetocode.com/blogs/scott/archive/2014/05/20/using-resolve-in-angularjs-routes.aspx

    function getDevice(serial) {
      DeviceService.get(serial, $scope)
        .then(function (device) {
          return GroupService.invite(device)
        })
        .then(function (device) {
          $scope.device = device
          $scope.control = ControlService.create(device, device.channel)

          SettingsService.set('lastUsedDevice', serial)

          return device
        })
        .catch(function () {
          $timeout(function () {
            $location.path('/')
          })
        })
    }

    getDevice($routeParams.serial)


    $scope.$watch('device.state', function (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (oldValue === 'using') {
          FatalMessageService.open($scope.device, false)
        }
      }
    }, true)

  }
