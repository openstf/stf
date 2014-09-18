module.exports =
  function StandaloneServiceFactory($window, $rootScope, SettingsService) {
    var service = {}

    //SettingsService.sync($scope, 'ControlWindow', {
    //  controlWindowWidth: 600,
    //  controlWindowHeight: 900,
    //  controlWindowTop: 50,
    //  controlWindowLeft: 50
    //})

    var screenWidth = $window.screen.availWidth || $window.screen.width || 1024
    var screenHeight = $window.screen.availHeight || $window.screen.height || 768
    var windowSizeRatio = 1.0

    function fitDeviceInGuestScreen(device) {
      var projected = {
        width: 600,
        height: 900,
        top: 50,
        left: 50
      }

      var deviceWidth = device.width
      var deviceHeight = device.height
      var deviceRotation = device.rotation

      return projected
    }

    service.open = function (device) {
      var url = '#!/c/' + (device.serial ? device.serial : '')

      var projected = fitDeviceInGuestScreen(device)

      var features = [
        'width=' + projected.width,
        'height=' + projected.height,
        'top=' + projected.top,
        'left=' + projected.left,
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

      var windowOpen = $window.open(url, 'StT', features)

      //windowOpen.onbeforeunload = function () {
      //  $scope.controlWindowWidth = windowOpen.innerWidth
      //  $scope.controlWindowHeight = windowOpen.innerHeight
      //  $scope.controlWindowTop = windowOpen.screenTop
      //  $scope.controlWindowLeft = windowOpen.screenLeft
      //}
    }


    return service
  }
