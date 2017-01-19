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
  return {
    restrict: 'E',
    template: require('./device-list-admin.pug'),
    scope: {
      tracker: '&tracker'
    },
    controller: function($scope){


      $scope.clickfunc = function () {
        socket.io.emit('logout')

      },
        $scope.groupChange = function () {
          $scope.$emit('refreshDevices')
          $scope.$emit('refreshUsers')
        },
        $scope.initUsers = function () {
          $scope.$emit('refreshUsers')
        },
        $scope.initGroups = function () {
          return new Promise(function(resolve, reject) {
            socket.emit('load.admin.groups')

            socket.on('admin.groups', function (data) {
              $scope.$apply(function () {
                $scope.groups = data.data
                resolve (true)
              })
            })
          })
        },
        $scope.addNewGroup = function () {
          var name = window.prompt("Enter New Group","");
          if ((name) && (name.trim())) {
            name = name.trim()
            var status = true
            $scope.groups.forEach(function (item) {
              if (item.name == name){
                status = false
              }
            })
            if (!(status)){
              alert("This Group name already exists!")
            }else{
              socket.emit('save.admin.group',{
                name: name
              })
              $scope.adminAvailableUsers = []
              $scope.adminGroupUsers = [];
              $scope.adminAvailableDevices = [];
              $scope.adminGroupDevices = [];
              $scope.mainGroup = name
              $scope.initGroups().then(function () {
                $scope.$emit('refreshDevices')
                $scope.$emit('refreshUsers')
              })
            }
          }
        },
        $scope.deleteGroup = function () {
          if (confirm('Are you sure you want to delete group: '+$scope.mainGroup)) {
            $scope.adminGroupUsers.forEach(function (user) {
              socket.emit('admin.Remove.User', {
                email: user.email,
                newGroup: $scope.mainGroup
              })
            })
            $scope.adminGroupDevices.forEach(function (device) {
              socket.emit('admin.Remove.Group', {
                serial: device.serial,
                newGroup: $scope.mainGroup
              })
            })
            socket.emit('delete.admin.group', {
              name: $scope.mainGroup
            })
            $scope.initGroups().then(function () {
              console.log($scope.groups)
              $scope.mainGroup = $scope.groups[0].name
              $scope.$emit('refreshDevices')
              $scope.$emit('refreshUsers')
            })
          }
        }

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
              setTimeout(function () {
                $scope.$emit('refreshDevices')
              },100)
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
              setTimeout(function () {
                $scope.$emit('refreshDevices')
              },100)
            }
          },
          $scope.clickUserGroupAdd = function () {

            if (!("selectedAvailableUsers" in $scope)){
              alert("Select user to add")
            }else {
              socket.emit('admin.Add.User', {
                email: $scope.selectedAvailableUsers[0],
                newGroup: $scope.mainGroup
              })
              setTimeout(function () {
                $scope.$emit('refreshUsers')
              },100)
            }
          },
          $scope.clickUserGroupRemove = function () {
            if (!("selectedGroupUsers" in $scope)){
              alert("Select user to remove")
            }else {
              socket.emit('admin.Remove.User', {
                email: $scope.selectedGroupUsers[0],
                newGroup: $scope.mainGroup
              })
              setTimeout(function () {
                $scope.$emit('refreshUsers')
              },100)
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
      var Promise = require("bluebird");


      scope.adminAvailableUsers = []
      scope.adminGroupUsers = [];
      scope.adminAvailableDevices = [];
      scope.adminGroupDevices = [];
      scope.allDevices = []
      scope.mainGroup = "default"


      function sortDevices(device) {
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
            }else if(device['controlGroups'].indexOf(scope.mainGroup) > -1 ){
              scope.adminGroupDevices.push({"serial":device['serial'], "model": device['model']})
            }else{
              scope.adminAvailableDevices.push({"serial":device['serial'], "model": device['model']})
            }
          })
        })
      }

      function refreshUserData(){
        socket.emit('get.Users')

        socket.on('admin.users', function(data) {
          // console.log(data.data)
          scope.adminAvailableUsers = [];
          var adminAvailableUsers = [];
          scope.adminGroupUsers = [];
          var adminGroupUsers = [];

          scope.allUsers = data.data
          // data.data.forEach(function (user) {
          Promise.each(data.data, function (user) {
            if (!("userGroups" in user)) {
              adminAvailableUsers.push({"email":user['email'], "name": user['name']})
            }else if (!("mainGroup" in scope)){
              adminAvailableUsers.push({"email":user['email'], "name": user['name']})
            }else if(user['userGroups'].indexOf(scope.mainGroup.toString()) > -1 ){
              adminGroupUsers.push({"email":user['email'], "name": user['name']})
            }else{
              adminAvailableUsers.push({"email":user['email'], "name": user['name']})
            }
          }).then(function () {
            scope.$apply(function () {
              scope.adminAvailableUsers = adminAvailableUsers;
              scope.adminGroupUsers = adminGroupUsers;
            })
          })
        })
      }


      // Triggers when the tracker sees a device for the first time.
      function addListener(device) {
        createAvailableGroup(device)
        refreshUserData()
        if (!(device['serial'] in scope.allDevices)) {
          scope.allDevices.push(device['serial'])
        }
      }

      function calculateId(device) {
        return prefix + device.serial
      }


      // Triggers when the tracker notices that a device changed.
      function changeListener(device) {
        // refreshData()
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
      scope.$on('refreshUsers', refreshUserData)
      scope.$on('refreshDevices', refreshData)

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

