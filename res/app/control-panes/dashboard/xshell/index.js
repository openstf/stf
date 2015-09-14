require('./shell.css')

module.exports = angular.module('stf.xshell', [
  require('stf/common-ui').name,
  require('gettext').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/dashboard/xshell/shell.jade',
      require('./shell.jade')
    )
  }])
  .controller('ShellCtrl', require('./shell-controller'))
