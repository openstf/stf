
module.exports =
  function ControlPanesController($scope, $http, gettext, $routeParams,
    $timeout, $location, DeviceService, GroupService, ControlService,
    StorageService, FatalMessageService, SettingsService, socket) {

    SettingsService.avdreset($routeParams.serial)

    console.log('Emulator "'+$routeParams.serial+'" device will be restarted')
    $location.path('/')
  }
