module.exports = function StoreAccountCtrl($scope, ngTableParams, $timeout) {
  // TODO: This should come from the DB
  $scope.currentAppStore = 'google-play-store'
  $scope.deviceAppStores = {
    'google-play-store': {
      type: 'google-play-store',
      name: 'Google Play Store',
      package: 'com.google'
    }
  }

  $scope.addingAccount = false

  $scope.addAccount = function() {
    $scope.addingAccount = true
    var user = $scope.storeLogin.username.$modelValue
    var pass = $scope.storeLogin.password.$modelValue

    $scope.control.addAccount(user, pass).then(function() {
    }).catch(function(result) {
      throw new Error('Adding account failed', result)
    }).finally(function() {
      $scope.addingAccount = false
      $timeout(function() {
        getAccounts()
      }, 500)
    })
  }

  $scope.removeAccount = function(account) {
    var storeAccountType = $scope.deviceAppStores[$scope.currentAppStore].package
    $scope.control.removeAccount(storeAccountType, account)
      .then(function() {
        getAccounts()
      })
      .catch(function(result) {
        throw new Error('Removing account failed', result)
      })
  }

  function getAccounts() {
    var storeAccountType = $scope.deviceAppStores[$scope.currentAppStore].package
    if ($scope.control) {
      $scope.control.getAccounts(storeAccountType).then(function(result) {
        $scope.$apply(function() {
          $scope.accountsList = result.body
        })
      })
    }
  }

  getAccounts()
}
