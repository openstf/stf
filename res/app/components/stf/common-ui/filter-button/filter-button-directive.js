module.exports = function filterButtonDirective() {
  return {
    require: 'ngModel',
    restrict: 'EA',
    replace: true,
    scope: {},
    template: require('./filter-button.jade')
  }
}
