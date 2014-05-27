module.exports = function InputCtrl($scope, KeycodesAndroid) {

  $scope.press = function (key) {
    console.log(key)
    var mapped = KeycodesAndroid[key]
    if (mapped) {
      $scope.control.rawKeyPress(mapped)
    } else {
      console.error(key + ' is not mapped')
    }
  }
}
