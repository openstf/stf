module.exports = angular.module('stf.testing.jobs', [
  require('stf/common-ui').name,
  require('stf/common-ui/modals/large-error-message').name,
  require('stf/jobs').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'testing/jobs/jobs.pug', require('./jobs.pug')
    )
  }])
  .controller('JobsCtrl', require('./jobs-controller'))
