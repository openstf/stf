define(['./module', 'oboe'], function(mod, oboe) {
  function DevicesServiceFactory($rootScope, socket) {
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

    oboe('/api/v1/devices')
      .node('devices[*]', function(device) {
        // We want to skip other arguments
        insert(device)
      })

    return deviceService
  }

  mod.factory('deviceService'
  , [ '$rootScope'
    , 'socketService'
    , DevicesServiceFactory
    ])
})
