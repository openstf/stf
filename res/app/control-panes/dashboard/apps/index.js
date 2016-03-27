require('./apps.css')

module.exports = angular.module('stf.apps', [
  require('stf/common-ui').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/dashboard/apps/apps.jade',
      require('./apps.jade')
    )
  }])
  .controller('AppsCtrl', require('./apps-controller'))
