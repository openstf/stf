require('./help-icon.css')

module.exports = function clearButtonDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      topic: '@',
      tooltip: '@'
    },
    template: require('./help-icon.jade')
  }
}
