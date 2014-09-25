module.exports =
  function StandaloneServiceFactory($window, $rootScope, SettingsService,
    ScalingService, GroupService) {
    var service = {}

    service.windows = []

    //SettingsService.sync($scope, 'ControlWindow', {
    //  controlWindowWidth: 600,
    //  controlWindowHeight: 900,
    //  controlWindowTop: 50,
    //  controlWindowLeft: 50
    //})

    var screenWidth = $window.screen.availWidth || $window.screen.width || 1024
    var screenHeight = $window.screen.availHeight || $window.screen.height ||
      768
    var windowSizeRatio = 0.5

    function fitDeviceInGuestScreen(device) {
      //console.log('device.width', device.width)
      //console.log('device', device)

      var screen = {
        scaler: ScalingService.coordinator(
          device.display.width, device.display.height
        ),
        rotation: device.display.rotation,
        bounds: {
          x: 0, y: 0, w: screenWidth, h: screenHeight
        }
      }

      var projectedSize = screen.scaler.projectedSize(
        screen.bounds.w * windowSizeRatio,
        screen.bounds.h * windowSizeRatio,
        screen.rotation
      )

      return projectedSize
    }

    service.open = function (device) {
      var url = '#!/c/' + (device.serial ? device.serial : '')

      var projected = fitDeviceInGuestScreen(device)

      var features = [
        'width=' + projected.width,
        'height=' + projected.height,
        //'top=' + 0,
        //'left=' + 0,
        'toolbar=no',
        'location=no',
        'dialog=yes',
        'personalbar=no',
        'directories=no',
        'status=no',
        'menubar=no',
        'scrollbars=no',
        'copyhistory=no',
        'resizable=yes'
      ].join(',')

      var newWindow = $window.open(url, 'STFNewWindow' + Date.now(), features)

      newWindow.onbeforeunload = function () {

        // TODO: check for usage
        GroupService.kick(device).then(function () {
          $rootScope.$digest()
        })
        //  $scope.controlWindowWidth = windowOpen.innerWidth
        //  $scope.controlWindowHeight = windowOpen.innerHeight
        //  $scope.controlWindowTop = windowOpen.screenTop
        //  $scope.controlWindowLeft = windowOpen.screenLeft
      }
    }


    return service
  }
