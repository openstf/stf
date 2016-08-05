module.exports = function errorMessageDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      message: '@'
    },
    template: require('./error-message.pug'),
    link: function(scope) {
      scope.closeMessage = function() {
        scope.message = ''
      }
    }
  }
}
