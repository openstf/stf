require('./upload.css')

module.exports = angular.module('stf.upload', [
  require('stf/common-ui/tree').name,
  require('./activities').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/dashboard/upload/upload.jade',
      require('./upload.jade')
    )
  }])
  .controller('UploadCtrl', require('./upload-controller'))
