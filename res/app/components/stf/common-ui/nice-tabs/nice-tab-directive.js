// Declarative syntax not implemented yet
module.exports = function niceTabDirective() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
    },
    template: require('./nice-tab.jade'),
    link: function() {
    }
  }
}
