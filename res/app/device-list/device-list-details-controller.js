module.exports = function DeviceListCtrlDetails($scope, DeviceService, GroupService, ControlService, ngTableParams, SettingsService, $filter, $location, gettext, $q) {

  // TODO: this is not working, why?
  $scope.filterEnabled = false
  SettingsService.bind($scope, {
    key: 'filterEnabled', storeName: 'DeviceList.filterEnabled'
  })



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
//  SettingsService.bind($scope, {
//    key: 'tableFilter',
//    storeName: 'DeviceList.tableFilter'
//  })

  $scope.tableSorting = {
    stateSorting: 'asc',     // initial sorting
    name: 'asc'     // initial sorting
  }
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

  $scope.tableParams = new ngTableParams(
    { filter: $scope.tableFilter, sorting: $scope.tableSorting
    }
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

  $scope.userContactUrl = function (mail) {
    var config = {
      hipchatEnabled: true,
      hipchatUrl: 'https://cyberagent.hipchat.com/chat?focus_jid='
    }

    if (config.hipchatEnabled) {
      return config.hipchatUrl + mail
    } else {
      return 'mailto:' + mail
    }
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

  $scope.columns = [
    { title: 'Model', field: 'model', sortable: 'model', filter: {model: 'text'}, visible: true
    }
    ,
    { title: 'Product', field: 'name', sortable: 'name', filter: {name: 'text'}, visible: true
    }
  ]
}
