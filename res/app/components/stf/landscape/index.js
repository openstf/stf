module.exports = angular.module('stf.landscape', [
  require('stf/browser-info').name
])
  .directive('landscape', require('./landscape-directive'))
