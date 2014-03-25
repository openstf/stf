require('angular-animate')
//require('angular-growl-v2/build/angular-growl.min.css')
require('./growl.css')
require('angular-growl-v2/build/angular-growl.js')

module.exports = angular.module('stf/common-ui/notifications', [
  'ngAnimate',
  'angular-growl'
]).config(['growlProvider', function (growlProvider) {
  growlProvider.globalEnableHtml(true)
}])
