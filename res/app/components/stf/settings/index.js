require('localforage')
require('angular-localForage')

module.exports = angular.module('stf/settings', [
  'LocalForageModule'
])
  .factory('SettingsService', require('./settings-service'))
