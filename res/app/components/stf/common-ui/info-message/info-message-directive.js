module.exports = function infoMessageDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      message: '@'
    },
    template: require('./info-message.pug'),
    link: function(scope) {
      scope.closeMessage = function() {
        scope.message = ''
      }
    }
  }
}
