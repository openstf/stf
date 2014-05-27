module.exports = function InputCtrl($scope, KeycodesAndroid) {

  $scope.press = function (key) {
    $scope.control.keyPress(key)
  }
}
