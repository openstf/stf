/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

require('./column-choice.css')

module.exports = angular.module('stf.column-choice', [
  require('stf/common-ui').name
])
  .directive('stfColumnChoice', require('./column-choice-directive'))


