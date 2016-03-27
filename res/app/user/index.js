module.exports = angular.module('stf.user-profile', [])
  .config(function($routeProvider) {

    $routeProvider
      .when('/user/:user*', {
        template: require('./user.jade')
      })
  })
  .controller('UserProfileCtrl', require('./user-controller'))
