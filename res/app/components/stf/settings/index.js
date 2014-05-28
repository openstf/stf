require('localforage')
require('angular-localForage')

module.exports = angular.module('stf/settings', [
  'LocalForageModule'
])
  .config(['$localForageProvider', function ($localForageProvider) {
    $localForageProvider.config({
      //driver: 'localStorageWrapper',
      name: 'stf-v0',
      version: 1.0,
      storeName: 'settings',
      description: 'STF Local Settings'
    })

  }])
  .factory('SettingsService', require('./settings-service'))
