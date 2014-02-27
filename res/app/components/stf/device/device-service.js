var oboe = require('oboe')
var _ = require('lodash')
var Promise = require('bluebird')

module.exports = function DeviceServiceFactory($rootScope, $http, socket) {
  var deviceService = {}

  function Tracker($scope, options) {
    var devices = []
      , devicesBySerial = Object.create(null)
      , scopedSocket = socket.scoped($scope)

    function get(data) {
      return devices[devicesBySerial[data.serial]]
    }

    function insert(data) {
      devicesBySerial[data.serial] = devices.push(data) - 1
      $scope.$digest()
    }

    function modify(oldData, newData) {
      _.assign(oldData, newData)
      $scope.$digest()
    }

    function remove(data) {
      var index = devicesBySerial[data.serial]
      if (index >= 0) {
        devices.splice(index, 1)
        delete devicesBySerial[data.serial]
        $scope.$digest()
      }
    }

    scopedSocket.on('device.add', function (data) {
      var device = get(data)
      if (device) {
        modify(device, data)
      }
      else if (options.auto) {
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
        modify(device, data)
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
      auto: true
    })

    oboe('/api/v1/devices')
      .node('devices[*]', function (device) {
        tracker.add(device)
      })

    return tracker
  }

  deviceService.get = function (serial) {
    return $http.get('/api/v1/devices/' + serial)
      .then(function (response) {
        return response.data.device
      })
  }

  return deviceService
}
