module.exports = function ControlPanesController($scope, $http, gettext, $routeParams, $timeout, $location, DeviceService, GroupService, ControlService, StorageService, FatalMessageService) {
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

  // @TODO Find a way to reuse this in the upload controller (or the other
  // way around)
  $scope.installFileForced = function ($files) {
    $scope.$apply(function () {
      $scope.upload = {
        progress: 0, lastData: 'uploading'
      }
    })

    return StorageService.storeFile('apk', $files, {
      filter: function (file) {
        return /\.apk$/i.test(file.name)
      }
    })
      .progressed(function (e) {
        if (e.lengthComputable) {
          $scope.$apply(function () {
            $scope.upload = {
              progress: e.loaded / e.total * 100, lastData: 'uploading'
            }
          })
        }
      })
      .then(function (res) {
        $scope.$apply(function () {
          $scope.upload = {
            progress: 100, lastData: 'processing'
          }
        })

        var href = res.data.resources.file0.href
        return $http.get(href + '/manifest')
          .then(function (res) {
            $scope.upload = {
              progress: 100, lastData: 'success', settled: true
            }

            if (res.data.success) {
              return $scope.installForced({
                href: href, launch: true, manifest: res.data.manifest
              })
            }
          })
      })
      .catch(function (err) {
        $scope.$apply(function () {
          if (err.code === 'no_input_files') {
            $scope.upload = null
          }
          else {
            console.log('Upload error', err)
            $scope.upload = {
              progress: 100, lastData: 'fail', settled: true, error: err.message
            }
          }
        })
      })
  }

  $scope.installForced = function (options) {
    return $scope.control.install(options)
      .progressed(function (installResult) {
        $scope.$apply(function () {
          installResult.manifest = options.manifest
          $scope.installation = installResult
        })
      })
      .then(function (installResult) {
        $scope.$apply(function () {
          installResult.manifest = options.manifest
          $scope.treeData = installResult.manifest
          $scope.installation = installResult
        })
      })
  }

  DeviceService.get($routeParams.serial, $scope)
    .then(function (device) {
      return GroupService.invite(device)
    })
    .then(function (device) {
      $scope.device = device
      $scope.control = ControlService.create(device, device.channel)

      //FatalMessageService.open($scope.device)

      return device
    })
    .catch(function () {
      $timeout(function () {
        $location.path('/')
      })
    })

  // TODO: WHAT???
  $scope.$watch('device')




  $scope.$watch('device.state', function (newValue, oldValue) {

    if (newValue !== oldValue) {
      if (oldValue === 'using') {
        FatalMessageService.open($scope.device)
      }
    } else if (typeof newValue === 'undefined' && typeof oldValue === 'undefined') {
      //FatalMessageService.open(angular.copy($scope.device))
    }
  }, true)
}
