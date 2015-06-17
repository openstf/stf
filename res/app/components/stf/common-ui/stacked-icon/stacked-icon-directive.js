require('./stacked-icon.css')

module.exports = function clearButtonDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      icon: '@',
      color: '@'
    },
    template: require('./stacked-icon.jade')
  }
}
