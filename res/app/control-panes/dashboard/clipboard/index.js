require('./clipboard.css')

require('angular-elastic')

module.exports = angular.module('stf.clipboard', [
  'monospaced.elastic',
  require('gettext').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/dashboard/clipboard/clipboard.jade',
      require('./clipboard.jade')
    )
  }])
  .controller('ClipboardCtrl', require('./clipboard-controller'))
