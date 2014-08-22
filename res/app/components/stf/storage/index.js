require('ng-file-upload')

module.exports = angular.module('stf/storage', [
  'angularFileUpload'
])
  .factory('StorageService', require('./storage-service'))
