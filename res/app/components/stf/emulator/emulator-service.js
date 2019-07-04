module.exports = function EmulatorServiceFactory($rootScope) {
  // Handle everything locally
  let EmulatorService = {}
  let emulators = []

  EmulatorService.getEmulators = function() {
    return emulators
  }

  EmulatorService.addEmulator = function(emulator) {
    emulators.push(emulator)
    $rootScope.$broadcast('testing.emulator.updated', emulator)
  }

  return EmulatorService
}
