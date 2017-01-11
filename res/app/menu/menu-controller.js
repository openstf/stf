module.exports = function MenuCtrl($scope, $rootScope, SettingsService,
  $location, AppState) {
  SettingsService.bind($scope, {
    target: 'lastUsedDevice'
  })

  SettingsService.bind($rootScope, {
    target: 'platform',
    defaultValue: 'native'
  })

  $scope.$on('$routeChangeSuccess', function() {
    $scope.isControlRoute = $location.path().search('/control') !== -1
  })

  function resetPaths() {
    window.location.href = ("/logout");
  }

  $scope.logout = function(){
    if (confirm('Are you sure you want to Log Out of STF?')) {
      resetPaths()
    } else {
      console.log("no");
    }
    // console.log(AppState);
  }

  $scope.init = function () {
    $scope.activeUser = AppState.user.name
  }

}
