require('./activities.css')

module.exports = angular.module('stf.activities', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put(
      'control-panes/dashboard/upload/activities/activities.jade',
      require('./activities.jade')
    )
  }])
  .controller('ActivitiesCtrl', require('./activities-controller'))
