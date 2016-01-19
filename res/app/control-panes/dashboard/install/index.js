require('./install.css')

require('ng-file-upload')

module.exports = angular.module('stf.install', [
  'angularFileUpload',
  require('./activities').name,
  require('stf/settings').name,
  require('stf/storage').name,
  require('stf/install').name,
  require('stf/upload').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/dashboard/install/install.jade',
      require('./install.jade')
    )
  }])
  .controller('InstallCtrl', require('./install-controller'))
