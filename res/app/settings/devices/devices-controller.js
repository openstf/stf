/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const _ = require('lodash')

module.exports = function DevicesCtrl(
  $scope
, DevicesService
, SettingsService
, ItemsPerPageOptionsService
, GenericModalService
, CommonService
) {
  const devicesBySerial = {}
  const deviceFields =
    'model,' +
    'serial,' +
    'version,' +
    'display.height,' +
    'display.width,' +
    'manufacturer,' +
    'sdk,' +
    'abi,' +
    'cpuPlatform,' +
    'openGLESVersion,' +
    'marketName,' +
    'phone.imei,' +
    'provider.name,' +
    'group.originName'


  function publishDevice(device) {
    if (!device.model) {
      device.display = {}
    }
    else {
      device.displayStr = device.display.width + 'x' + device.display.height
    }
    for (var i in device) {
      if (device[i] === null) {
        device[i] = ''
      }
    }
    return device
  }

  function addDevice(device, timeStamp) {
    return CommonService.add(
      $scope.devices
    , devicesBySerial
    , device
    , 'serial'
    , timeStamp)
  }

  function updateDevice(device, timeStamp) {
    return CommonService.update(
      $scope.devices
    , devicesBySerial
    , device
    , 'serial'
    , timeStamp)
  }

  function deleteDevice(serial, timeStamp) {
    return CommonService.delete(
      $scope.devices
    , devicesBySerial
    , serial
    , timeStamp)
  }

  function initScope() {
    DevicesService.getOboeDevices('user', deviceFields, function(device) {
      addDevice(publishDevice(device), -1)
    })
    .done(function() {
      $scope.$digest()
    })
  }

  SettingsService.bind($scope, {
    target: 'removingFilters'
  , source: 'DevicesRemovingFilters'
  , defaultValue: {
      present: 'False'
    , booked: 'False'
    , annotated: 'False'
    , controlled: 'False'
    }
  })
  $scope.devices = []
  $scope.confirmRemove = {value: true}
  $scope.scopeDevicesCtrl = $scope
  $scope.itemsPerPageOptions = ItemsPerPageOptionsService
  SettingsService.bind($scope, {
    target: 'deviceItemsPerPage'
  , source: 'deviceItemsPerPage'
  , defaultValue: $scope.itemsPerPageOptions[2]
  })
  $scope.removingFilterOptions = ['True', 'False', 'Any']

  $scope.removeDevice = function(serial, askConfirmation) {
    if (askConfirmation) {
      GenericModalService.open({
        message: 'Really delete this device?'
      , type: 'Warning'
      , size: 'sm'
      , cancel: true
      })
      .then(function() {
        CommonService.errorWrapper(
          DevicesService.removeDevice
        , [serial, $scope.removingFilters]
        )
      })
    }
    else {
      CommonService.errorWrapper(
        DevicesService.removeDevice
      , [serial, $scope.removingFilters]
      )
    }
  }

  $scope.removeDevices = function(search, filteredDevices, askConfirmation) {
    function removeDevices() {
      CommonService.errorWrapper(
        DevicesService.removeDevices
      , search ?
          [$scope.removingFilters, filteredDevices.map(function(device) {
            return device.serial
          })
          .join()] :
          [$scope.removingFilters]
      )
    }

    if (askConfirmation) {
      GenericModalService.open({
        message: 'Really delete this selection of devices?'
      , type: 'Warning'
      , size: 'sm'
      , cancel: true
      })
      .then(function() {
        removeDevices()
      })
    }
    else {
      removeDevices()
    }
  }

  $scope.$on('user.settings.devices.created', function(event, message) {
    addDevice(publishDevice(message.device), message.timeStamp)
  })

  $scope.$on('user.settings.devices.deleted', function(event, message) {
    deleteDevice(message.device.serial, message.timeStamp)
  })

  $scope.$on('user.settings.devices.updated', function(event, message) {
    updateDevice(publishDevice(message.device), message.timeStamp)
  })

  initScope()
}
