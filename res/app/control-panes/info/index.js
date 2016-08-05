require('./info.css')

module.exports = angular.module('stf.info', [
  require('stf/angular-packery').name,
  require('stf/common-ui/modals/lightbox-image').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/info/info.pug',
      require('./info.pug')
    )
  }])
  .controller('InfoCtrl', require('./info-controller'))
