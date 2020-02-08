/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = angular.module('stf.settings.general.date-format', [
  require('stf/settings').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/general/date-format/date-format.pug', require('./date-format.pug')
    )
  }])
  .controller('DateFormatCtrl', require('./date-format-controller'))
