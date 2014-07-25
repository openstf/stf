require('./store-account.css')

module.exports = angular.module('stf.store-account', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/automation/store-account/store-account.jade',
      require('./store-account.jade')
    )
  }])
  .controller('StoreAccountCtrl', require('./store-account-controller'))
