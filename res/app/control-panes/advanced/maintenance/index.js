module.exports = angular.module('stf.advanced.maintenance', [
  require('gettext').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/advanced/maintenance/maintenance.jade',
      require('./maintenance.jade')
    )
  }])
  .controller('MaintenanceCtrl', require('./maintenance-controller'))
