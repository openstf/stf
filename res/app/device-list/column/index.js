/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = angular.module('stf.device-list.column', [
  require('gettext').name,
  require('stf/settings').name,
  require('stf/app-state').name
])
  .service('DeviceColumnService', require('./device-column-service'))
