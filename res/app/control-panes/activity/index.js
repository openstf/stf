require('./activity.css')

module.exports = angular.module('stf.activity', [
  require('gettext').name,
  require('stf/common-ui').name,
  require('stf/timeline').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/activity/activity.jade',
      require('./activity.jade')
    )
  }])
  .controller('ActivityCtrl', require('./activity-controller'))
