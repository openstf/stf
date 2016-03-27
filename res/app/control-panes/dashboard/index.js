module.exports = angular.module('stf.dashboard', [
  require('./navigation/index').name,
  require('./shell/index').name,
  require('./install/index').name,
  require('./apps/index').name,
  require('./clipboard/index').name,
  require('./remote-debug/index').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'control-panes/dashboard/dashboard.jade'
      , require('./dashboard.jade')
    )
  }])
  .controller('DashboardCtrl', require('./dashboard-controller'))
