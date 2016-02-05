require('./topapp.css')

module.exports = angular.module('stf.topapp', [
  require('stf/common-ui').name,
  require('gettext').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/dashboard/topapp/topapp.jade',
      require('./topapp.jade')
    )
  }])
  .controller('TopAppCtrl', require('./topapp-controller'))
