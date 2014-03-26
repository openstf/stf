module.exports = function refreshPageDirective() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
    },
    template: require('./refresh-page.jade'),
    link: function () {
      // TODO: reload with $route.reload()
    }
  }
}
