module.exports = angular.module('stf.user-profile', [])
  .config(function($routeProvider) {

    $routeProvider
      .when('/user/:user*', {
        template: require('./user.pug')
      })
  })
  .controller('UserProfileCtrl', require('./user-controller'))
