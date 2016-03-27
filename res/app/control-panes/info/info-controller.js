module.exports = function InfoCtrl($scope, LightboxImageService) {
  $scope.openDevicePhoto = function(device) {
    var title = device.name
    var enhancedPhoto800 = '/static/app/devices/photo/x800/' + device.image
    LightboxImageService.open(title, enhancedPhoto800)
  }

  var getSdStatus = function() {
    if ($scope.control) {
      $scope.control.getSdStatus().then(function(result) {
        $scope.$apply(function() {
          $scope.sdCardMounted = (result.lastData === 'sd_mounted')
        })
      })
    }
  }
  getSdStatus()
}
