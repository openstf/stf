module.exports = function screenKeyboardDirective() {
  return {
    restrict: 'E',
    template: require('./screen-keyboard.jade'),
    link: function(scope, element) {
      element.find('input')

    }
  }
}
