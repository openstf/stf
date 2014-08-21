module.exports = angular.module('stf/settings', [
  require('stf/user').name
])
  .factory('SettingsService', require('./settings-service'))
