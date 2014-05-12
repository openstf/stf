require('./clipboard.css')

module.exports = angular.module('stf.clipboard', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/dashboard/clipboard/clipboard.jade',
      require('./clipboard.jade')
    )
  }])
  .controller('ClipboardCtrl', require('./clipboard-controller'))
