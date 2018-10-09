module.exports = function loadingWheelDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
    },
    template: require('./loading-wheel.pug'),
    link: function(scope) {
    }
  }
}
