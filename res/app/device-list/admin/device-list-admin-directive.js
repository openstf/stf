module.exports = function DeviceListAdminDirective($filter
  , $compile
  , $rootScope
  , gettext
  , DeviceColumnService
  , GroupService
  , DeviceService
  , LightboxImageService
  , StandaloneService
  , socket
  , UserService) {
  // console.log(UserService)
  return {
    restrict: 'E',
    template: require('./device-list-admin.pug'),
    scope: {
      tracker: '&tracker'
    },
    controller: function($scope){


      $scope.clickfunc = function () {
        console.log($scope)
        socket.emit('load.admin.groups')

        socket.on('admin.groups', function(data) {
          console.log("data")
          console.log(data)
          // $scope.groups = data
        })

      },
        $scope.groupChange = function () {
          $scope.$emit('refresh')
          // alert($scope.mainGroup)
        },
        $scope.initGroups = function () {
          socket.emit('load.admin.groups')

          socket.on('admin.groups', function(data) {
            $scope.groups = data.data
            $scope.mainGroup = "0"
            $scope.$emit('refresh')
          })
        }
      // $scope.groups = [
      //   {id:'g1', name:'g1'},
      //   {id:'g2', name:'g2'},
      //   {id:'g3', name:'g3'}
      // ];
        $scope.user = {
          name: 'daniel'
        },
          $scope.clickDeviceGroupAdd = function () {
            if (!("selectedAvailableDevices" in $scope)){
              alert("Select device to add")
            }else {
              socket.emit('admin.Add.Group', {
                serial: $scope.selectedAvailableDevices[0],
                newGroup: $scope.mainGroup
              })
              $scope.$emit('refresh')
            }
          },
          $scope.clickDeviceGroupRemove = function () {
            if (!("selectedGroupDevices" in $scope)){
              alert("Select device to remove")
            }else {
              socket.emit('admin.Remove.Group', {
                serial: $scope.selectedGroupDevices[0],
                newGroup: $scope.mainGroup
              })
              $scope.$emit('refresh')
            }
          }
    }, link: function(scope, element) {
      var tracker = scope.tracker()
      var table = element.find('table')[0]
      var tbody = table.createTBody()
      var rows = tbody.rows
      var prefix = 'd' + Math.floor(Math.random() * 1000000) + '-'
      var mapping = Object.create(null)
      var childScopes = Object.create(null)



      scope.adminAvailableDevices = [];
      scope.adminGroupDevices = [];
      scope.allDevices = []

      function getUsersData(){

      }



      function sortDevices(device) {
        console.log("sort")
        if (!("controlGroups" in device)) {
          return false
        }else if (!("mainGroup" in scope)){
          return false
        }else if(device['controlGroups'].indexOf(scope.mainGroup) > 0 ){
          return true
        }else{
          return false
        }
      }
      function createAvailableGroup(device) {
        var sortResult = sortDevices(device)
        if (sortResult){
          scope.adminGroupDevices.push({"serial":device['serial'], "model": device['model']})
        }else {
          scope.adminAvailableDevices.push({"serial":device['serial'], "model": device['model']})

        }
      }
      function refreshData(){
        scope.adminAvailableDevices = [];
        scope.adminGroupDevices = [];
        scope.allDevices.forEach(function (serial) {
          DeviceService.load(serial).then(function (device) {
            if (!("controlGroups" in device)) {
              scope.adminAvailableDevices.push({"serial":device['serial'], "model": device['model']})
            }else if (!("mainGroup" in scope)){
              scope.adminAvailableDevices.push({"serial":device['serial'], "model": device['model']})
            }else if(device['controlGroups'].indexOf(scope.mainGroup) > 0 ){
              scope.adminGroupDevices.push({"serial":device['serial'], "model": device['model']})
            }else{
              scope.adminAvailableDevices.push({"serial":device['serial'], "model": device['model']})
            }
          })
        })

      }


      // Triggers when the tracker sees a device for the first time.
      function addListener(device) {
        createAvailableGroup(device)
        if (!(device['serial'] in scope.allDevices)) {
          scope.allDevices.push(device['serial'])
        }
      }

      function calculateId(device) {
        return prefix + device.serial
      }


      // Triggers when the tracker notices that a device changed.
      function changeListener(device) {
        refreshData()
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
      scope.$on('refresh', changeListener)
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
