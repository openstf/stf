require('./add-testing-tool.css')

module.exports = angular.module('stf.add-testing-tool', [
  require('gettext').name,
  require('stf/common-ui').name,
  require('stf/testing-tools').name
])
  .directive('addTestingTool', require('./add-testing-tool-directive'))
