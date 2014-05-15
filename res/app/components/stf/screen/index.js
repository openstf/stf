module.exports = angular.module('stf/screen', [
  require('stf/screen/scaling').name
, require('stf/util/vendor').name
, require('stf/page-visibility').name
, require('stf/browser-info').name
])
  .directive('deviceScreen', require('./screen-directive'))
  .controller('DeviceScreenCtrl', require('./screen-controller'))
