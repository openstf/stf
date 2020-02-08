/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = function EmailAddressSeparatorCtrl(
  $scope
, SettingsService
) {

  $scope.defaultEmailAddressSeparator = ','
  SettingsService.bind($scope, {
    target: 'emailAddressSeparator'
  , source: 'emailAddressSeparator'
  , defaultValue: $scope.defaultEmailAddressSeparator
  })

  $scope.$watch(
    function() {
      return SettingsService.get('emailAddressSeparator')
    }
  , function(newvalue) {
      if (typeof newvalue === 'undefined') {
        SettingsService.set('emailAddressSeparator', $scope.defaultEmailAddressSeparator)
      }
    }
  )
}
