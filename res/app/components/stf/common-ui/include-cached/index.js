module.exports = angular.module('stf.include-cached', [

])
  .factory('CompileCacheService', require('./compile-cache-service'))
  .directive('ngIncludeCached', require('./include-cached-directive'))
