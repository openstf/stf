require('angular-hotkeys')
module.exports = angular.module('stf.scoped-hotkeys', [
  'cfp.hotkeys'
])
  .factory('ScopedHotkeysService', require('./scoped-hotkeys-service'))
