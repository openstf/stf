require('./run-test.css')

module.exports = angular.module('stf.testing.run-test', [
  require('angular-xeditable').name,
  require('stf/common-ui').name,
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/control').name,
  require('stf/settings').name,
  require('stf/testing-tools').name,
  require('stf/command-executor').name,
  require('./add-testing-tool').name,
  require('../../device-list/column').name,
  require('../../device-list/details').name,
  require('../../device-list/empty').name,
  require('../../device-list/icons').name,
  require('../../device-list/stats').name,
  require('../../device-list/customize').name,
  require('../../device-list/search').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'testing/run-test/run-test.pug', require('./run-test.pug')
    )
  }])
  .controller('RunTestCtrl', require('./run-test-controller'))
