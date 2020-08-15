require('./video-recorder.css')

module.exports = angular.module('stf.video-recorder', [
  require('stf/image-onload').name,
  require('stf/settings').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/video-recorder/video-recorder.pug',
      require('./video-recorder.pug')
    )
  }])
  .controller('VideoRecorderCtrl', require('./video-recorder-controller'))
