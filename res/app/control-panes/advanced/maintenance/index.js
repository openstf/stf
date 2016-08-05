module.exports = angular.module('stf.advanced.maintenance', [
  require('gettext').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/advanced/maintenance/maintenance.pug',
      require('./maintenance.pug')
    )
  }])
  .controller('MaintenanceCtrl', require('./maintenance-controller'))
