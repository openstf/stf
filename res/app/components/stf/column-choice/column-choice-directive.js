/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = function() {
  return {
    restrict: 'E',
    scope: {
      buttonStyle: '@?',
      columnData: '=',
      resetData: '&'
    },
    template: require('./column-choice.pug'),
  }
}
