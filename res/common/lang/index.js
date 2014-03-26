angular.module("gettext").run(['gettextCatalog', function (gettextCatalog) {
  gettextCatalog.setStrings('ja', require('./translations/stf.ja.json').ja )
}])

module.exports = angular.module('stf/lang', [
  'gettext'
])
