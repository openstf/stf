module.exports = angular.module('stf.user-profile', [])
  .config(function ($routeProvider) {

    // if CONFIG.externalProfileURL else show page
    var externalProfileURL = ''
    var templateString

    if (!externalProfileURL) {
      templateString = require('./user.jade')
    }

    $routeProvider
      .when('/user/:user*', {
        template: function (params) {
          console.log('params', params)
          if (externalProfileURL) {
            window.location.href = 'http://www.google.com';
          }

          return '<div></div>'
        },
        controller: function () {

        }
      })

  })
  .controller('UserProfileCtrl', require('./user-controller'))
