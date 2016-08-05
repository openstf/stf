module.exports = function screenKeyboardDirective() {
  return {
    restrict: 'E',
    template: require('./screen-keyboard.pug'),
    link: function(scope, element) {
      element.find('input')

    }
  }
}
