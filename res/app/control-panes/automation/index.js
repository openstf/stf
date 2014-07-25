module.exports = angular.module('stf.automation', [
  require('./store-account/index').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put(
      'control-panes/automation/automation.jade'
      , require('./automation.jade')
    )
  }])
