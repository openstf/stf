/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = function() {
  return function(objects, scope, currentPage, maxItems, searchItems) {
    scope[searchItems] = objects
    if (scope[maxItems].value === 0) {
      return objects
    }
    return objects.slice(
             (scope[currentPage] - 1) * scope[maxItems].value
           , scope[currentPage] * scope[maxItems].value
           )
  }
}
