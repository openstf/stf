module.exports = function logcatTableDirective() {
  return {
    restrict: 'E',
    replace: true,
    scope: {

    },
    template: require('./logcat-table.jade'),
    link: function (scope, element, attrs) {

    }
  }
}
