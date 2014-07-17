module.exports = function nativeAutocompleteDirective() {
  return {
    restrict: 'E',
    replace: true,
    scope: {

    },
    template: require('./native-autocomplete.jade'),
    link: function (scope, element, attrs) {

    }
  }
}
