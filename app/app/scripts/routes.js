define(['./app'], function(app) {
  return app.config([
      '$routeProvider'
    , '$locationProvider'
    , function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true)
        $routeProvider
          .when('/', {
            templateUrl: 'partials/signin'
          , controller: 'SignInCtrl'
          })
          .otherwise({
            redirectTo: '/'
          })
      }
  ])
})
