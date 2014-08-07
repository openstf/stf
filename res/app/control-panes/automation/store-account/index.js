require('./store-account.css')
require('angular-ladda')

module.exports = angular.module('stf.store-account', [
  'angular-ladda'
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/automation/store-account/store-account.jade',
      require('./store-account.jade')
    )
  }])
  .controller('StoreAccountCtrl', require('./store-account-controller'))
