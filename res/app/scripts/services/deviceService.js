define(['./module', 'oboe'], function(mod, oboe) {
  function DevicesServiceFactory($rootScope, socketService) {
    var deviceService = {
      devices: []
    }

    oboe('/api/v1/devices')
      .node('devices[*]', function(device) {
        deviceService.devices.push(device)
        $rootScope.$digest()
      })

    return deviceService
  }

  mod.factory('deviceService'
  , [ '$rootScope'
    , 'socketService'
    , DevicesServiceFactory
    ])
})
