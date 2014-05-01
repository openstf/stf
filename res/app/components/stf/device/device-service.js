var oboe = require('oboe')
var _ = require('lodash')

module.exports = function DeviceServiceFactory($http, socket) {
  var deviceService = {}

  function Tracker($scope, options) {
    var devices = []
      , devicesBySerial = Object.create(null)
      , scopedSocket = socket.scoped($scope)

    function notify() {
      $scope.$broadcast('devices.update', true)

      // Not great. Consider something else
      if (!$scope.$$phase) {
        $scope.$digest()
      }
    }

    function sync(data) {
      // usable IF device is physically present AND device is online AND
      // preparations are ready AND the device has no owner or we are the
      // owner
      data.usable = data.present && data.status === 3 && data.ready &&
        (!data.owner || data.using)

      // Make sure we don't mistakenly think we still have the device
      if (!data.usable) {
        data.using = false
      }

      // For convenience, formulate an aggregate state property that covers
      // every possible state.
      data.state = 'absent'
      if (data.present) {
        data.state = 'present'
        switch (data.status) {
          case 1:
            data.state = 'offline'
            break
          case 2:
            data.state = 'unauthorized'
            break
          case 3:
            data.state = 'preparing'
            if (data.ready) {
              data.state = 'ready'
              if (data.using) {
                data.state = 'using'
              }
              else {
                if (data.owner) {
                  data.state = 'busy'
                }
                else {
                  data.state = 'available'
                }
              }
            }
            break
        }
      }
    }

    function get(data) {
      return devices[devicesBySerial[data.serial]]
    }

    function insert(data) {
      devicesBySerial[data.serial] = devices.push(data) - 1
      sync(data)
      notify()
    }

    function modify(data, newData) {
      _.merge(data, newData)
      sync(data)
      notify()
    }

    function remove(data) {
      var index = devicesBySerial[data.serial]
      if (index >= 0) {
        devices.splice(index, 1)
        delete devicesBySerial[data.serial]
        notify()
      }
    }

    function fetch(data) {
      deviceService.load(data.serial)
        .then(changeListener)
        .catch(function() {})
    }

    function addListener(data) {
      var device = get(data)
      if (device) {
        modify(device, data)
      }
      else if (options.filter(data)) {
        insert(data)
      }
    }

    function removeListener(data) {
      var device = get(data)
      if (device) {
        modify(device, data)
        if (!options.filter(device)) {
          remove(device)
        }
      }
      else {
        if (options.filter(data)) {
          insert(data)
          // We've only got partial data
          fetch(data)
        }
      }
    }

    function changeListener(data) {
      var device = get(data)
      if (device) {
        modify(device, data)
        if (!options.filter(device)) {
          remove(device)
        }
      }
      else {
        if (options.filter(data)) {
          insert(data)
          // We've only got partial data
          fetch(data)
        }
      }
    }

    scopedSocket.on('device.add', addListener)
    scopedSocket.on('device.remove', removeListener)
    scopedSocket.on('device.change', changeListener)

    this.add = function(device) {
      remove(device)
      insert(device)
    }

    this.devices = devices
  }

  deviceService.trackAll = function ($scope) {
    var tracker = new Tracker($scope, {
      filter: function(device) {
        return true
      }
    })

    oboe('/api/v1/devices')
      .node('devices[*]', function (device) {
        tracker.add(device)
      })

    return tracker
  }

  deviceService.trackGroup = function ($scope) {
    var tracker = new Tracker($scope, {
      filter: function(device) {
        return device.using
      }
    })

    oboe('/api/v1/group')
      .node('devices[*]', function (device) {
        tracker.add(device)
      })

    return tracker
  }

  deviceService.load = function(serial) {
    return $http.get('/api/v1/devices/' + serial)
      .then(function (response) {
        return response.data.device
      })
  }

  deviceService.get = function (serial, $scope) {
    var tracker = new Tracker($scope, {
      filter: function(device) {
        return device.serial === serial
      }
    })

    return deviceService.load(serial)
      .then(function(device) {
        tracker.add(device)
        return device
      })
  }

  return deviceService
}
