var oboe = require('oboe')
var _ = require('lodash')
var Promise = require('bluebird')

module.exports = function DeviceServiceFactory($rootScope, $http, socket) {
  var deviceService = {}

  function Tracker($scope, options) {
    var devices = []
      , devicesBySerial = Object.create(null)
      , scopedSocket = socket.scoped($scope)

    function notify() {
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
      _.assign(data, newData)
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

    scopedSocket.on('device.add', function (data) {
      var device = get(data)
      if (device) {
        modify(device, data)
      }
      else if (options.insertPresent) {
        insert(data)
      }
    })

    scopedSocket.on('device.remove', function (data) {
      var device = get(data)
      if (device) {
        modify(device, data)
      }
    })

    scopedSocket.on('device.change', function (data) {
      var device = get(data)
      if (device) {
        if (options.removeAbsent) {
          remove(device)
        }
        else {
          modify(device, data)
        }
      }
    })

    this.add = function(device) {
      remove(device)
      insert(device)
    }

    this.devices = devices
  }

  deviceService.trackAll = function ($scope) {
    var tracker = new Tracker($scope, {
      insertPresent: true
    })

    oboe('/api/v1/devices')
      .node('devices[*]', function (device) {
        tracker.add(device)
      })

    return tracker
  }

  deviceService.trackGroup = function ($scope) {
    var tracker = new Tracker($scope, {
      removeAbsent: true
    })

    oboe('/api/v1/group')
      .node('devices[*]', function (device) {
        tracker.add(device)
      })

    return tracker
  }

  deviceService.get = function (serial, $scope) {
    var tracker = new Tracker($scope, {})

    return $http.get('/api/v1/devices/' + serial)
      .then(function (response) {
        tracker.add(response.data.device)
        return response.data.device
      })
  }

  return deviceService
}
