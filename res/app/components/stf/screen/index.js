module.exports = angular.module('stf/screen', [
  require('stf/screen/scaling').name
])
  .factory('DeviceScreenDirective', require('./screen-directive'));
