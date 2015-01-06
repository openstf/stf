require('angular-cookies')

module.exports = angular.module('stf.enable-autofill', [
  'ngCookies'
])
  .directive('enableAutofill', require('./enable-autofill-directive'))
