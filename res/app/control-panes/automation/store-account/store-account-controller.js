module.exports = function StoreAccountCtrl($scope, ngTableParams) {
  // TODO: This should come from the DB
  $scope.currentAppStore = 'google-play-store'
  $scope.deviceAppStores = {
    "google-play-store": {
      "type": 'google-play-store',
      "name": 'Google Play Store',
      "package": 'com.google'
    }
  }

  console.log('$scope.deviceAppStores[$scope.currentAppStore].package',
    $scope.deviceAppStores[$scope.currentAppStore].package)


  $scope.addAccount = function () {
    var user = $scope.storeLogin.username.$modelValue
    var pass = $scope.storeLogin.password.$modelValue

    $scope.control.addAccount(user, pass).then(function () {
      //getAccounts()
    }).catch(function (result) {
      console.log('Adding account failed', result)
    })
  }

  $scope.removeAccount = function (account) {
    var storeAccountType = $scope.deviceAppStores[$scope.currentAppStore].package
    $scope.control.removeAccount(storeAccountType, account)
      .then(function (result) {
        getAccounts()
      })
      .catch(function (result) {
        console.log('Removing account failed', result)
      })
  }

  function getAccounts() {
    var storeAccountType = $scope.deviceAppStores[$scope.currentAppStore].package
    $scope.control.getAccounts(storeAccountType).then(function (result) {
      $scope.accountsList = result.body
      $scope.accountsTable.reload()
    })
  }
  getAccounts()

  $scope.accountsTable = new ngTableParams({
    page: 1,
    count: 5000
  }, {
    counts: [],
    total: 1,
    getData: function ($defer) {
      $defer.resolve($scope.accountsList)
    }
  })
}
