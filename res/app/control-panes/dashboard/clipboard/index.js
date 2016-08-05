require('./clipboard.css')

require('angular-elastic')

module.exports = angular.module('stf.clipboard', [
  'monospaced.elastic',
  require('gettext').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/dashboard/clipboard/clipboard.pug',
      require('./clipboard.pug')
    )
  }])
  .controller('ClipboardCtrl', require('./clipboard-controller'))
