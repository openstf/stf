module.exports = function StoreAccountCtrl($scope) {
  $scope.addAccount = function () {
    var user = $scope.storeLogin.username.$modelValue
    var pass = $scope.storeLogin.password.$modelValue

    $scope.control.addAccount(user, pass).then(function () {
    }).catch(function (res) {
      console.log('Adding account failed', res)
    })
  }

  $scope.removeAccounts = function () {
    $scope.control.removeAccount().then(function (res) {
    }).catch(function (res) {
      console.log('Removing account failed', res)
    })
  }
}
