require('./activity.css')

module.exports = angular.module('stf.activity', [
  require('gettext').name,
  require('stf/common-ui').name,
  require('stf/timeline').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/activity/activity.pug',
      require('./activity.pug')
    )
  }])
  .controller('ActivityCtrl', require('./activity-controller'))
