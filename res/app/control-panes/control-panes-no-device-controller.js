module.exports =
  function ControlPanesNoDeviceController($location, SettingsService) {
    var lastUsedDevice = SettingsService.get('lastUsedDevice')

    if (lastUsedDevice) {
      $location.path('/control/' + lastUsedDevice)
    } else {
      $location.path('/')
    }
  }
