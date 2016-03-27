module.exports =
  function StandaloneServiceFactory($window, $rootScope, SettingsService,
    ScalingService, GroupService, $timeout) {
    var service = {}

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


    service.open = function(device) {
      var url = '#!/c/' + (device.serial ? device.serial : '') + '?standalone'

      var projected = fitDeviceInGuestScreen(device)

      var features = [
        'width=' + projected.width,
        'height=' + projected.height,
        'top=' + (screenHeight / 4),
        'left=' + (screenWidth / 5),
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

      var newWindow = $window.open(url, 'STF-' + device.serial, features)

      function setWindowTitle(newWindow, device) {
        var windowTitle = 'STF - ' + device.name
        if (device.name !== device.model) {
          windowTitle += ' (' + device.model + ')'
        }
        //windowTitle += ' (' + device.serial + ')'

        if (newWindow.document) {
          newWindow.document.title = windowTitle
        }

        $timeout(function() {
          if (newWindow.document) {
            newWindow.document.title = windowTitle
          }
        }, 400)
      }

      setWindowTitle(newWindow, device)


      newWindow.onbeforeunload = function() {

        // TODO: check for usage
        GroupService.kick(device).then(function() {
          $rootScope.$digest()
        })

        // TODO: save coordinates
        //  $scope.controlWindowWidth = windowOpen.innerWidth
        //  $scope.controlWindowHeight = windowOpen.innerHeight
        //  $scope.controlWindowTop = windowOpen.screenTop
        //  $scope.controlWindowLeft = windowOpen.screenLeft
      }

      // TODO: Resize on-demand
      //newWindow.onresize = function (e) {
      //  var windowWidth =  e.target.outerWidth
      //  var windowHeight =  e.target.outerHeight
      //
      //  var newWindowWidth = Math.floor(projected.width * windowHeight / projected.height)
      //  console.log('newWindowWidth', newWindowWidth)
      //  console.log('windowWidth', windowWidth)
      //
      //  newWindow.resizeTo(newWindowWidth, windowHeight)
      //}
    }


    return service
  }
