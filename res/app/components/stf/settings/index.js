require('localforage')
require('angular-localForage')

module.exports = angular.module('stf/settings', [
  'LocalForageModule'
])
  .config(['$localForageProvider', function ($localForageProvider) {
    $localForageProvider.setPrefix('stf.v0');
  }])
  .factory('SettingsService', require('./settings-service'))
