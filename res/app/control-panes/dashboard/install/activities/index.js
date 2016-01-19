require('./activities.css')

module.exports = angular.module('stf.activities', [
  require('stf/common-ui').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'control-panes/dashboard/install/activities/activities.jade',
      require('./activities.jade')
    )
  }])
  .controller('ActivitiesCtrl', require('./activities-controller'))
