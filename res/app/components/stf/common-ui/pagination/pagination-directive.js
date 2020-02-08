/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = function() {
  return {
    restrict: 'E',
    scope: {
      tooltipLabel: '@',
      iconStyle: '@?',
      itemsSearchStyle: '@?',
      itemsSearch: '=',
      itemsPerPageOptions: '<',
      itemsPerPage: '=',
      totalItems: '<',
      totalItemsStyle: '@?',
      currentPage: '='
    },
    template: require('./pagination.pug'),
    link: function(scope, element, attrs) {
      scope.currentPage = 1
    }
  }
}
