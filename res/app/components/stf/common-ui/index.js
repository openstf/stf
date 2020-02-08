/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = angular.module('stf/common-ui', [
  require('./pagination').name,
  require('./safe-apply').name,
  require('./clear-button').name,
  require('./filter-button').name,
  require('./nothing-to-show').name,
  require('./error-message').name,
  require('./table').name,
  require('./notifications').name,
  require('./ng-enter').name,
  require('./tooltips').name,
  require('./modals').name,
  require('./include-cached').name,
  require('./text-focus-select').name,
  require('./counter').name,
  require('./badge-icon').name,
  require('./enable-autofill').name,
  require('./icon-inside-input').name,
  require('./focus-element').name,
  require('./blur-element').name,
  require('./stacked-icon').name,
  require('./help-icon').name
])
