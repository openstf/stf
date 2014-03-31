require('./upload.css')

module.exports = angular.module('stf.upload', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/dashboard/upload/upload.jade',
      require('./upload.jade')
    )
  }])
  .controller('UploadCtrl', require('./upload-controller'))
