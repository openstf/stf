module.exports = function DeviceListAdminDirective($filter
  , $compile
  , $rootScope
  , gettext
  , DeviceColumnService
  , GroupService
  , DeviceService
  , LightboxImageService
  , StandaloneService
  , socket) {
  console.log(socket.emit('test',{"one": "two"}))
  return {
    restrict: 'E',
    template: require('./device-list-admin.pug'),
    scope: {
      tracker: '&tracker'
    },
    controller: function($scope){
      $scope.clickfunc = function () {
        console.log($scope)
        alert('work')
      },
        $scope.groupChange = function () {
          console.log($scope)
          alert($scope.mainGroup)
        },
      $scope.groups = [
        {id:'1', name:'g1'},
        {id:'2', name:'g2'},
        {id:'2', name:'g3'}
      ];
        $scope.user = {
          name: 'daniel'
        },
          $scope.clickDeviceGroupAdd = function () {
            console.log($scope);
          }
    }, link: function(scope, element) {
      var tracker = scope.tracker()
      var table = element.find('table')[0]
      var tbody = table.createTBody()
      var rows = tbody.rows
      var prefix = 'd' + Math.floor(Math.random() * 1000000) + '-'
      var mapping = Object.create(null)
      var childScopes = Object.create(null)

      // socket.emit('test',{"one": "two"})

      // console.log("1")
      // var dbapi = require('../../../../lib/db/api')
      // console.log("2")
      //
      // var dbDevices = dbapi.loadDevices()
      // console.log("3")
      //
      // console.log(dbDevices)

      scope.adminAvailableDevices = [];
      scope.adminGroupDevices = [];

      function createRow(device) {
        var id = calculateId(device)
        var tr = document.createElement('tr')
        var td

        tr.id = id

        if (!device.usable) {
          tr.classList.add('device-not-usable')
        }

        for (var i = 0, l = activeColumns.length; i < l; ++i) {
          td = scope.columnDefinitions[activeColumns[i]].build()
          scope.columnDefinitions[activeColumns[i]].update(td, device)
          tr.appendChild(td)
        }

        mapping[id] = device
        console.log(tr)
        return tr
      }
      function filterRow(row, device) {
        if (match(device)) {
          row.classList.remove('filter-out')
        }
        else {
          row.classList.add('filter-out')
        }
      }
      function insertRow(tr, deviceA) {
        return insertRowToSegment(tr, deviceA, 0, rows.length - 1)
      }

      function sortDevices(device) {
        console.log("sort")
        if (!("controlGroups" in device)){
          if ("model" in device)
          {
            return device['model']
          }else {
          }
        }else if(device['controlGroups'][0] == 'default'){
          if ("model" in device)
          {
            return device['model']
          }else {
          }
        }else{
          console.log("3")
        }
        return false
      }
      function createAvailableGroup(device) {
        tmp = sortDevices(device)
        if ((tmp) && ((scope.adminAvailableDevices.indexOf(tmp) < 0 ))){
          console.log(tmp)
          console.log(scope.adminAvailableDevices)
          scope.adminAvailableDevices.push(tmp)
        }else if ((!tmp) && ((scope.adminGroupDevices.indexOf(tmp) < 0 ))){
          scope.adminGroupDevices.push()
        }
        console.log("add+")
        console.log(scope.adminAvailableDevices)
      }


      // Triggers when the tracker sees a device for the first time.
      function addListener(device) {
        console.log("add")
        socket.emit('test',{"one": "two"})
        createAvailableGroup(device)
      }

      function calculateId(device) {
        return prefix + device.serial
      }


      // Triggers when the tracker notices that a device changed.
      function changeListener(device) {
        console.log("change")
        createAvailableGroup(device)
      }

      // Triggers when a device is removed entirely from the tracker.
      function removeListener(device) {
        var id = calculateId(device)
        var tr = tbody.children[id]

        if (tr) {
          tbody.removeChild(tr)
        }

        delete mapping[id]
      }

      tracker.on('add', addListener)
      tracker.on('change', changeListener)
      // tracker.on('remove', removeListener)

      // Maybe we're already late
      tracker.devices.forEach(addListener)

      scope.$on('$destroy', function() {
        tracker.removeListener('add', addListener)
        tracker.removeListener('change', changeListener)
        // tracker.removeListener('remove', removeListener)
      })
    }
  };
}
