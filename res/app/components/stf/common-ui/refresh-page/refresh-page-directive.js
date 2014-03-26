module.exports = function refreshPageDirective() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
    },
    template: require('./refresh-page.jade'),
    link: function (scope, element, attrs) {
      // TODO: reload with $route.reload()
    }
  }
}
