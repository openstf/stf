/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = angular.module('stf.modals', [
  require('./generic-modal').name,
  require('./fatal-message').name,
  require('./socket-disconnected').name,
  require('./version-update').name,
  require('./add-adb-key-modal').name,
  require('./save-log-modal').name
])
