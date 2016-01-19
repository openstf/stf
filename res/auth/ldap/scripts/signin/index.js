require('./signin.css')

module.exports = angular.module('stf.signin', [])
  .config(function($routeProvider) {
    $routeProvider
      .when('/auth/ldap/', {
        template: require('./signin.jade')
      })
  })
  .controller('SignInCtrl', require('./signin-controller'))
