module.exports = function errorMessageDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      message: '@'
    },
    template: require('./error-message.jade'),
    link: function (scope, element, attrs) {
      scope.closeMessage = function () {
        scope.message = ''
      }
    }
  }
}
