module.exports = function MenuCtrl($scope, $rootScope, SettingsService,
  $location, $http) {
  console.log(global.app);
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
    // $scope = undefined
    // $location = undefined
    // AppState = undefined
    console.log("start");
    // var fs = require('fs')
    // var express = require('express')

    // var app = express()
    // app.use(function(req, res, next) {
    //   res.cookie("express.sid", "", { expires: new Date() })
    //   next()
    // })

    // app.get('/', function(req, res) {
    //   res.clearCookie("localhost")
    // })

    // AppState.config.websocketUrl = null
    // $location.$$path = "/"
    // $location.$$url = "/"
    // $location.$$absUrl = "/"
    // location.replace("/")
  }

  $scope.logout = function(){
  if (confirm('Are you sure you want to Log Out of STF?')) {
    console.log($scope);
    console.log($rootScope);
    resetPaths()
    console.log($scope);
    console.log($rootScope);
  } else {
    console.log("no");
  }
    // console.log(AppState);
  }

}
