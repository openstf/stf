module.exports = function addEmulatorDirective(EmulatorService) {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      showAddEmulator: '=',
      showClipboard: '='
    },
    template: require('./add-emulator.pug'),
    controller: function($scope) {
      const systemImageDefault = 'system-images;android-23;google_apis;x86'
      const sdCardSizeDefault = 1200
      const setupParametersDefault = '-no-boot-anim -no-window -no-audio -gpu off -no-snapshot-save -wipe-data'
      const numberEmulatorsDefault = 1

      $scope.addForm = {
        systemImage: systemImageDefault
        , sdCardSize: sdCardSizeDefault
        , startupParameters: setupParametersDefault
        , numberEmulators: numberEmulatorsDefault
      }

      $scope.$on('testing.emulator.updated', function() {
        $scope.closeAddEmulator()
      })

      $scope.addEmulator = function() {
        EmulatorService.addEmulator({
          systemImage: $scope.addForm.systemImage
          , sdCardSize: $scope.addForm.sdCardSize
          , startupParameters: $scope.addForm.startupParameters
          , numberEmulators: $scope.addForm.numberEmulators
        })
      }

      $scope.closeAddEmulator = function() {
        $scope.addForm.systemImage = systemImageDefault
        $scope.addForm.sdCardSize = sdCardSizeDefault
        $scope.addForm.startupParameters = setupParametersDefault
        $scope.addForm.numberEmulators = numberEmulatorsDefault
        $scope.showAddEmulator = false
        $scope.error = ''
      }
    }
  }
}
