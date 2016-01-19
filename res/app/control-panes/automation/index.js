module.exports = angular.module('stf.automation', [
  require('./store-account').name,
  require('./device-settings').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'control-panes/automation/automation.jade'
      , require('./automation.jade')
    )
  }])
