require('./activities.css')

module.exports = angular.module('stf.activities', [
  require('stf/common-ui').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'control-panes/dashboard/install/activities/activities.pug',
      require('./activities.pug')
    )
  }])
  .controller('ActivitiesCtrl', require('./activities-controller'))
