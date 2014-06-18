module.exports = function InfoCtrl($scope, LightboxImageService) {
  $scope.openDevicePhoto = function (device) {
    var title = device.name
    var enhancedPhoto800 = '/static/devices/photo/x800/' + device.image
    LightboxImageService.open(title, enhancedPhoto800)
  }
}
