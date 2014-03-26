require('angular-bootstrap')
require('angular-dialog-service/dialogs')
require('angular-dialog-service/dialogs.css')

module.exports = angular.module('ui-local-settings', [
  require('stf/settings').name,
  'ui.bootstrap',
  //'dialogs'
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put(
      'settings/local/local-settings.jade'
    , require('./local-settings.jade')
    )
  }])
  .controller('LocalSettingsCtrl', require('./local-settings-controller'))
