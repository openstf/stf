
module.exports =
  function ControlPanesController($scope, $http, gettext, $routeParams,
    $timeout, $location, DeviceService, GroupService, ControlService,
    StorageService, FatalMessageService, SettingsService, socket) {

    SettingsService.avdreset($routeParams.emulator_name, $routeParams.serial)
    console.log('Emulator "'+$routeParams.serial+'" device will be restarted. Will work on "' + $routeParams.serial.split('-').pop(-1) + '" port')
    $location.path('/')
  }
