
module.exports =
  function ControlPanesController($scope, $http, gettext, $routeParams,
    $timeout, $location, DeviceService, GroupService, ControlService,
    StorageService, FatalMessageService, SettingsService, socket) {

    SettingsService.avdreset($routeParams.emulator_name, $routeParams.serial)
    $location.path('/')
  }
