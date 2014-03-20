module.exports = function clearButtonDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {},
    template: require('./clear-button.jade')
  }
}
