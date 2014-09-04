require('./upload.css')

require('ng-file-upload')

module.exports = angular.module('stf.upload', [
  'angularFileUpload',
  require('./activities').name,
  require('stf/settings').name,
  require('stf/storage').name,
  require('stf/install').name,
  require('stf/upload').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/dashboard/upload/upload.jade',
      require('./upload.jade')
    )
  }])
  .controller('UploadCtrl', require('./upload-controller'))
