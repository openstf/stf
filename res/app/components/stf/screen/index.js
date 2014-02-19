module.exports = angular.module('stf/screen', [
  require('stf/screen/scaling').name
])
  .directive('deviceScreen', require('./screen-directive'))