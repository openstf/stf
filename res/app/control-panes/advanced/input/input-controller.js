module.exports = function InputCtrl($scope) {

  $scope.press = function(key) {
    $scope.control.keyPress(key)
  }
}
