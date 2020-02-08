/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

require('./pagination.css')

module.exports = angular.module('stf.pagination', [
])
  .filter('pagedObjectsFilter', require('./pagination-filter'))
  .directive('stfPager', require('./pagination-directive'))
  .factory('ItemsPerPageOptionsService', require('./pagination-service'))
  
