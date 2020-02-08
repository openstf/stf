/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

require('./devices.css')

module.exports = angular.module('stf.settings.devices', [
  require('stf/common-ui').name,
  require('stf/settings').name,
  require('stf/util/common').name,
  require('stf/devices').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/devices/devices.pug', require('./devices.pug')
    )
  }])
  .controller('DevicesCtrl', require('./devices-controller'))
