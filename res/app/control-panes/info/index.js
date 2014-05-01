require('./info.css')

module.exports = angular.module('stf.info', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/info/info.jade',
      require('./info.jade')
    )
  }])
  .controller('InfoCtrl', require('./info-controller'))
