module.exports = angular.module('stf.logcat', [
  require('stf/filter-string').name
])
  .factory('LogcatService', require('./logcat-service'))
