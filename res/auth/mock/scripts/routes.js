define(['./app'], function(app) {
  return app.config([
      '$routeProvider'
    , '$locationProvider'
    , function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true)
        $routeProvider
          .when('/auth/mock/', {
            templateUrl: '/static/auth/mock/views/partials/signin.html'
          , controller: 'SignInCtrl'
          })
          .otherwise({
            redirectTo: '/auth/mock/'
          })
      }
  ])
})
