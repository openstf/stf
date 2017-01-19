module.exports = function MenuCtrl($scope, $rootScope, SettingsService,
  $location, AppState, socket) {
  SettingsService.bind($scope, {
    target: 'lastUsedDevice'
  })

  SettingsService.bind($rootScope, {
    target: 'platform',
    defaultValue: 'native'
  })

  $scope.$on('$routeChangeSuccess', function () {
    $scope.isControlRoute = $location.path().search('/control') !== -1
  })

  function resetPaths() {
    window.location.href = ("/logout");
  }

  $scope.logout = function () {
    if (confirm('Are you sure you want to Log Out of STF?')) {
      resetPaths()
    } else {
      console.log("no");
    }
    // console.log(AppState);
  }

  $scope.init = function () {
    $scope.activeUser = AppState.user.name
    $scope.activeUserEmail = AppState.user.email
    if ("file" in AppState.user) {
      $scope.userFile = AppState.user.file
    }else {
      $scope.userFile = "http://s3.narvii.com/image/h6pnvel4fum44j5bcxfae6lgn7tyozlj_128.jpg"
    }
    if (("userGroups" in AppState.user) && (AppState.user.userGroups.length > 0)) {
      $scope.userGroups = AppState.user.userGroups.toString()
    }else {
      $scope.userGroups = "Not in any group"
    }
  }

  $scope.add = function(){
    var f = $scope.avatarFile[0]
    if (f == undefined){
      return
    }
    var r = new FileReader();
    r.onloadend = function(e){
      var data = e.target.result;
      socket.emit('uploadAvatar',{
        email: AppState.user.email,
        file: data
      })
      $scope.$apply(function () {
        $scope.userFile = data;
        $scope.avatarFile = ""
      });
    }
    r.readAsDataURL(f);
  }

}
