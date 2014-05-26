require('./info.css')

module.exports = angular.module('stf.info', [
  require('stf/angular-packery').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/info/info.jade',
      require('./info.jade')
    )
  }])
  .controller('InfoCtrl', require('./info-controller'))
