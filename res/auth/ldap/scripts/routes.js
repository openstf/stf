define(['./app'], function(app) {
  return app.config([
      '$routeProvider'
    , '$locationProvider'
    , function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true)
        $routeProvider
          .when('/auth/ldap/', {
            templateUrl: '/static/auth/ldap/views/signin.html'
          , controller: 'SignInCtrl'
          })
          .otherwise({
            redirectTo: '/auth/ldap/'
          })
      }
  ])
})
