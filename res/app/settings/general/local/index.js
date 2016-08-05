require('angular-bootstrap')

module.exports = angular.module('ui-local-settings', [
  require('stf/settings').name,
  require('stf/common-ui/modals/common').name,
  'ui.bootstrap'
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/general/local/local-settings.pug'
    , require('./local-settings.pug')
    )
  }])
  .controller('LocalSettingsCtrl', require('./local-settings-controller'))
