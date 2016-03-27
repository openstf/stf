require('./screenshots.css')

module.exports = angular.module('stf.screenshots', [
  require('stf/image-onload').name,
  require('stf/settings').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/screenshots/screenshots.jade',
      require('./screenshots.jade')
    )
  }])
  .controller('ScreenshotsCtrl', require('./screenshots-controller'))
