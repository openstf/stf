define(['./module', 'oboe'], function(mod, oboe) {
  function DeviceServiceFactory($rootScope, $http, socket) {
    var deviceService = {
      devices: []
    , devicesBySerial: {}
    }

    function get(data) {
      return deviceService.devices[deviceService.devicesBySerial[data.serial]]
    }

    function insert(data, alter) {
      deviceService.devicesBySerial[data.serial] =
        deviceService.devices.push(data) - 1
      _.assign(data, alter)
      $rootScope.$digest()
    }

    function modify(data, properties) {
      if (data) {
        _.assign(data, properties)
        $rootScope.$digest()
      }
    }

    function remove(data) {
      var index = deviceService.devicesBySerial[data.serial]
      if (index >= 0) {
        deviceService.devices.splice(index, 1)
        delete deviceService.devicesBySerial[data.serial]
        $rootScope.$digest()
      }
    }

    socket.on('device.present', function(data) {
      remove(data)
      insert(data, {
        present: true
      })
    })

    socket.on('device.status', function(data) {
      modify(get(data), data)
    })

    socket.on('device.absent', function(data) {
      remove(data)
    })

    socket.on('device.identity', function(data) {
      modify(get(data), data)
    })

    socket.on('group.join', function(data) {
      modify(get(data), data)
    })

    socket.on('group.leave', function(data) {
      modify(get(data), {
        owner: null
      })
    })

    oboe('/api/v1/devices')
      .node('devices[*]', function(device) {
        // We want to skip other arguments
        insert(device)
      })

    deviceService.get = function(serial) {
      return $http.get('/api/v1/devices/' + serial)
        .then(function(response) {
          return response.data.device
        })
    }

    return deviceService
  }

  mod.factory('deviceService'
  , [ '$rootScope'
    , '$http'
    , 'socketService'
    , DeviceServiceFactory
    ])
})
