require('angular-animate')
require('./growl.css')
require('angular-growl')

module.exports = angular.module('stf/common-ui/notifications', [
  'ngAnimate',
  'angular-growl'
])
