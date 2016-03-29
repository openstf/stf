module.exports = function textFocusSelectDirective() {
  return {
    restrict: 'AC',
    link: function(scope, element) {
      // TODO: try with focus event
      element.bind('click', function() {
        this.select()
      })
    }
  }
}
