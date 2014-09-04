module.exports = angular.module('stf.upload-service', [
  require('gettext').name
])
  .filter('uploadError', require('./upload-error-filter'))
