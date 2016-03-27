require('angular-bootstrap')

module.exports = angular.module('ui-local-settings', [
  require('stf/settings').name,
  require('stf/common-ui/modals/common').name,
  'ui.bootstrap'
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/general/local/local-settings.jade'
    , require('./local-settings.jade')
    )
  }])
  .controller('LocalSettingsCtrl', require('./local-settings-controller'))
