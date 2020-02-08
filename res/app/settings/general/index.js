/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

require('./general.css')

module.exports = angular.module('stf.settings.general', [
  require('./language').name,
  require('./local').name,
  require('./email-address-separator').name,
  require('./date-format').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/general/general.pug'
      , require('./general.pug')
    )
  }])
  .controller('GeneralCtrl', require('./general-controller'))
