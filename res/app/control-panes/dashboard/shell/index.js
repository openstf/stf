require('./shell.css')

module.exports = angular.module('stf.shell', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/dashboard/shell/shell.jade',
      require('./shell.jade')
    )
  }])
  .controller('ShellCtrl', require('./shell-controller'))
