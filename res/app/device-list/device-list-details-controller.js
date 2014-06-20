module.exports = function DeviceListCtrlDetails($scope, DeviceService, GroupService, ControlService, ngTableParams, SettingsService, $filter, $location, gettext, $q, $timeout) {

  $scope.ngTableEnabled = true

  // TODO: this is not working, why?
  $scope.filterEnabled = false
  SettingsService.bind($scope, {
    key: 'filterEnabled', storeName: 'DeviceList.filterEnabled'
  })


//  SettingsService.bind($scope, {
//    key: 'tableFilter',
//    storeName: 'DeviceList.tableFilter'
//  })


//  SettingsService.bind($scope, {
//    key: 'tableSorting',
//    storeName: 'DeviceList.tableSorting'
//  })

//  $scope.$watchCollection('tableParams.sorting()', function (data) {
//    $scope.tableSorting = data
//  })
//
//  $scope.$watchCollection('tableParams.filter()', function (data) {
//    $scope.tableFilter = data
//  })

  if ($scope.ngTableEnabled) {

    $scope.statusFilter = function () {
      var def = $q.defer()
      var statuses = [
        { id: true, title: gettext('Available')
        }
        ,
        { id: false, title: gettext('N/A')
        }
      ]
      def.resolve(statuses)
      return def
    }

    $scope.tableFilter = {
      usable: ''
    }

    var initialSorting = {
      enhancedStateSorting: 'asc',
      enhancedName: 'asc'
    }
    $scope.tableSorting = initialSorting

    $scope.clearSorting = function () {
      $scope.tableParams.sorting(initialSorting)
      $scope.tableParams.filter({})
    }

    $scope.tableParams = new ngTableParams(
      { filter: $scope.tableFilter, sorting: $scope.tableSorting }
      , { total: 1, counts: [], filterDelay: 0, getData: function ($defer, params) {
        var data = $scope.tracker.devices

        var filteredData = params.filter() ?
          $filter('filter')(data, params.filter()) :
          data

        var orderedData = params.sorting() ?
          $filter('orderBy')(filteredData, params.orderBy()) :
          data

        $defer.resolve(orderedData)
      }
      })

    $scope.$on('devices.update', function () {
      $scope.tableParams.reload()
    })
  }

  if (!$scope.ngTableEnabled) {
    $scope.tableLimit = 1000

    $scope.dynamicColumns = [
      { title: gettext('Status'), field: 'enhancedStateSorting', templateUrl: 'device-list/details/status.jade', visible: true },
      { title: gettext('Model'), field: 'enhancedModel', templateUrl: 'device-list/details/model.jade', visible: true },
      { title: gettext('Product'), field: 'enhancedName', visible: true },
      { title: gettext('Carrier'), field: 'operator', visible: true },
      { title: gettext('Released'), field: 'enhancedReleasedAt', visible: true },
      { title: gettext('OS'), field: 'version', visible: true },
      { title: gettext('Network'), field: 'phone.network', visible: true },
      { title: gettext('Screen'), field: 'enhanceDisplayRes', visible: true },
      { title: gettext('Serial'), field: 'serial', visible: true },
      { title: gettext('Manufacturer'), field: 'manufacturer', visible: true },
      { title: gettext('SDK'), field: 'sdk', visible: true },
      { title: gettext('ABI'), field: 'abi', visible: true },
      { title: gettext('Phone'), field: 'phone.phoneNumber', visible: true },
      { title: gettext('Phone IMEI'), field: 'phone.imei', visible: true },
      { title: gettext('Phone ICCID'), field: 'phone.iccid', visible: true },
      { title: gettext('Battery Health'), field: 'enhancedBatteryHealth', visible: true },
      { title: gettext('Battery Source'), field: 'enhancedBatterySource', visible: true },
      { title: gettext('Battery Status'), field: 'enhancedBatteryStatus', visible: true },
      { title: gettext('Battery Level'), field: 'enhancedBatteryPercentage', templateUrl: 'device-list/details/battery-level.jade', visible: true },
      { title: gettext('Battery Temperature'), field: 'enhancedBatteryTemp', visible: true },
      { title: gettext('Location'), field: 'provider.name', visible: true },
      { title: gettext('User'), field: 'enhancedUserName', templateUrl: 'device-list/details/user.jade', visible: true }
    ]

    //$scope.selectedColumns = [$scope.dynamicColumns[1], $scope.dynamicColumns[2]]
    $scope.selectedColumns = [
      $scope.dynamicColumns[0],
      $scope.dynamicColumns[1],
      $scope.dynamicColumns[2],
      $scope.dynamicColumns[3],
      $scope.dynamicColumns[4],
      $scope.dynamicColumns[5],
      $scope.dynamicColumns[6],
      $scope.dynamicColumns[20],
      $scope.dynamicColumns[21]
    ]
  }


  $scope.tryToKick = function (device) {
    var config = {
      kickingEnabled: true
    }

    if (config.kickingEnabled) {
      if (device.state === 'busy') {
        if (confirm($filter('translate')(
          gettext('Are you sure you want to kick this device?\nCurrently it is being used by ')) + device.owner.name)) {
          $scope.kick(device, true)
        }
      }
    }
  }


}
