require('./nothing-to-show.css')

module.exports = angular.module('stf/common/nothing-to-show', [])
  .directive('nothingToShow', require('./nothing-to-show-directive'))
