require('./nothing-to-show.css')

module.exports = angular.module('stf/common-ui/nothing-to-show', [])
  .directive('nothingToShow', require('./nothing-to-show-directive'))
